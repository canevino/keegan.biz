/* Species-led growth architecture — each organism has its own stem topology.
   The chosen layout can bias the silhouette, but it must not replace the
   species' habit with a generic pair of upright branches. */
window.MS=window.MS||{};
((M)=>{
 'use strict';
 const P=(x,y)=>({x,y}),box=(x,y,w,h)=>({x,y,w,h});
 const sum=(a,b)=>P(a.x+b.x,a.y+b.y);
 const move=(p,dx=0,dy=0)=>P(p.x+dx,p.y+dy);
 const stems=[];
 function make(a,b,c,d,width,role='main',habit='branch'){
   return {a,b,c,d,width,major:role==='main',role,character:habit};
 }
 const rand=(r,a)=>r.between(-a,a);
 function crown(r,x=425,y=895){return P(x+rand(r,32),y+rand(r,23));}
 const shrub=(r,{baseX=420,count=3,spread=245,endY=210,width=12,bend=.26,habit='shrub'})=>{
   const root=crown(r,baseX,922),out=[];
   for(let i=0;i<count;i++){
     const k=count===1?0:(i/(count-1)*2-1),end=P(root.x+k*spread+rand(r,49),endY+rand(r,80)+Math.abs(k)*70);
     const a=move(root,k*62+rand(r,10),rand(r,10));
     const b=P(root.x+k*spread*.33+rand(r,24),root.y-255+rand(r,28));
     const c=P(end.x-k*spread*bend+rand(r,50),end.y+235+rand(r,46));
     out.push(make(a,b,c,end,width*(i===Math.floor(count/2)?1.2:r.between(.72,.96)),i===0||i===Math.floor(count/2)?'main':'lateral',habit));
   }
   return out;
 };
 const forms={
   holly(r){
     return shrub(r,{count:3,spread:190,endY:215,width:12.5,bend:.18,habit:'dense-woody'});
   },
   hazel(r){
     return shrub(r,{count:r.int(4,5),spread:290,endY:160,width:7.7,bend:.32,habit:'arching-coppice'});
   },
   hawthorn(r){
     const root=crown(r,415,931),middle=P(423+rand(r,50),160+rand(r,40));
     return [
       make(root,P(325,680),P(475,375),middle,15,'main','thorn-tree'),
       make(P(386,625),P(225,560),P(180,390),P(105+rand(r,40),315),6.2,'lateral','thorn-tree'),
       make(P(442,510),P(580,470),P(645,335),P(720+rand(r,32),277),5.7,'lateral','thorn-tree')
     ];
   },
   oak(r){
     const root=crown(r,390,948),tip=P(410+rand(r,40),145+rand(r,40));
     return [
       make(root,P(root.x-10,690),P(460,335),tip,26,'main','oak-trunk'),
       make(P(396,620),P(270,575),P(170,368),P(120+rand(r,40),295),12,'lateral','oak-limb'),
       make(P(431,495),P(580,435),P(670,265),P(722+rand(r,25),225),11,'lateral','oak-limb'),
       make(P(409,380),P(280,280),P(245,205),P(210+rand(r,45),140),7,'lateral','oak-limb')
     ];
   },
   ivy(r){
     const root=P(160+rand(r,45),900+rand(r,25));
     return [
       make(root,P(60,580),P(530,565),P(560+rand(r,50),132),5.3,'main','creeper'),
       make(P(290,615),P(575,790),P(785,430),P(738,200+rand(r,55)),3.4,'lateral','trailing'),
       make(P(320,575),P(175,420),P(55,255),P(130+rand(r,50),135),3.1,'lateral','climbing')
     ];
   },
   honeysuckle(r){
     const root=crown(r,420,934);
     return [
       make(root,P(160,660),P(690,530),P(376+rand(r,50),145),5.4,'main','twining'),
       make(root,P(675,680),P(180,415),P(477+rand(r,32),127),4.4,'main','twining'),
       make(P(362,560),P(230,460),P(200,280),P(150+rand(r,55),234),2.3,'lateral','twining')
     ];
   },
   bramble(r){
     const root=crown(r,415,910);
     return [
       make(root,P(90,625),P(170,250),P(70+rand(r,55),460+rand(r,65)),7.5,'main','arching-cane'),
       make(root,P(565,400),P(740,260),P(730+rand(r,42),545+rand(r,55)),7,'main','arching-cane'),
       make(root,P(300,410),P(525,220),P(520+rand(r,60),280),4.8,'lateral','arching-cane')
     ];
   },
   dogrose(r){
     const root=crown(r,412,918);
     return [
       make(root,P(175,645),P(145,345),P(65+rand(r,65),470),6.5,'main','rose-cane'),
       make(root,P(655,615),P(705,295),P(755+rand(r,32),470),6.0,'main','rose-cane'),
       make(root,P(270,515),P(375,255),P(450+rand(r,70),185),4.4,'lateral','rose-cane')
     ];
   },
   acanthus(r){
     const root=crown(r,425,915);
     return [
       make(root,P(275,610),P(250,325),P(310+rand(r,50),168),9,'main','acanthus'),
       make(root,P(550,615),P(600,290),P(605+rand(r,50),150),8,'main','acanthus'),
       make(root,P(190,710),P(120,570),P(115+rand(r,45),380),4.5,'lateral','acanthus')
     ];
   },
   fern(r){
     const root=crown(r,420,882),N=r.int(7,9),out=[];
     for(let i=0;i<N;i++){
       const a=-Math.PI+.18+i*(Math.PI-.36)/(N-1),distance=r.between(295,455);
       const end=P(root.x+Math.cos(a)*distance,root.y+Math.sin(a)*distance*1.75);
       const b=P(root.x+Math.cos(a)*distance*.24,root.y-150+Math.sin(a)*36);
       const c=P(root.x+Math.cos(a)*distance*.82,root.y+Math.sin(a)*distance*1.25-80);
       out.push(make(root,b,c,end,1.6,'frond','frond'));
     }
     return out;
   }
 };
 // The form selection stays meaningful, but acts as a global gesture rather
 // than replacing every species with the exact same skeletal arrangement.
 function arrange(axes,layout,r){
   const pivot=P(425,555);
   return axes.map((stem,i)=>{
     const mod=(p)=>{
       const rel=P(p.x-pivot.x,p.y-pivot.y);let x=rel.x,y=rel.y;
       if(layout==='diagonal')x+=(555-p.y)*.21;
       if(layout==='crescent')x+=Math.sign(x||((i%2)*2-1))*Math.sin(Math.max(0,Math.min(1,(940-p.y)/950))*Math.PI)*33;
       if(layout==='meander')x+=Math.sin((p.y/1000)*Math.PI*2.1+i*.55)*50;
       if(layout==='radiating')x*=1.13;
       if(layout==='cluster')x*=.82;
       if(layout==='single')x*=.91;
       return P(M.clamp(pivot.x+x+rand(r,2.8),24,826),M.clamp(pivot.y+y+rand(r,2.8),24,970));
     };
     const a=mod(stem.a),b=mod(stem.b),c=mod(stem.c),d=mod(stem.d);
     return {...stem,a,b,c,d};
   });
 }
 M.makeSpeciesAxes=(species,layout,r)=>{
   const key=species==='hybrid'?'acanthus':species;
   const form=forms[key];
   if(!form)return null;
   return arrange(form(r),layout,r).map((st,i)=>{
     const pts=M.wave(st.a,st.b,st.c,st.d,30),xs=pts.map(p=>p.x),ys=pts.map(p=>p.y),pad=85;
     const area=box(Math.min(...xs)-pad,Math.min(...ys)-pad,Math.max(...xs)-Math.min(...xs)+2*pad,Math.max(...ys)-Math.min(...ys)+2*pad);
     return {...st,id:i+1,side:i%2?-1:1,box:area};
   });
 };
})(window.MS);
