/* Composition engine — no manuscript frames, no literal scenes, no background. */
window.Ornament=window.Ornament||{};
((O)=>{
 'use strict';
 const {f,clamp,point,path,fill,blob,W,H}=O;
 const MODE={
   chance:{k:1,v:1,l:1,b:1},
   interlace:{k:2.0,v:.62,l:.48,b:.74},
   thicket:{k:.62,v:2.3,l:.55,b:.85},
   type:{k:.72,v:.4,l:2.6,b:1.3},
   rupture:{k:1.15,v:1.1,l:1.3,b:2.4}
 };
 function arrangement(r,s){
   const key=r.pick(['split','drift','eruption','constellation','crop','diagonal','single']);
   let pts=[];
   if(key==='split')pts=[{x:r.n(130,350),y:r.n(180,790),size:1.5},{x:r.n(850,1180),y:r.n(150,840),size:1.1}];
   if(key==='drift')for(let i=0;i<r.int(3,6);i++)pts.push({x:90+i*240+r.n(-170,170),y:320+Math.sin(i*1.3)*235+r.n(-145,145),size:r.n(.4,1.15)});
   if(key==='eruption')pts=[{x:r.pick([100,1180]),y:r.n(140,890),size:r.n(1.6,2.5)},{x:r.n(400,1000),y:r.n(80,900),size:.7}];
   if(key==='constellation')for(let i=0;i<r.int(3,7);i++)pts.push({x:r.n(0,1280),y:r.n(0,960),size:r.n(.45,1.6)});
   if(key==='crop')pts=[{x:r.n(370,930),y:r.pick([-110,1060]),size:r.n(2,2.9)},{x:r.n(120,1160),y:r.n(160,800),size:r.n(.35,.8)}];
   if(key==='diagonal')for(let i=0;i<r.int(3,5);i++)pts.push({x:i*300+r.n(-170,140),y:960-i*255+r.n(-160,140),size:r.n(.7,1.6)});
   if(key==='single')pts=[{x:r.n(290,980),y:r.n(210,750),size:r.n(1.5,2.6)}];
   return {key,pts};
 }
 function fragments(r,s,pal,kind,anchors){
   const n=Math.round((18+110*s.density/100)*(kind==='rupture'?2:1));let out='';
   for(let i=0;i<n;i++){
     const anchor=r.pick(anchors),cluster=r.chance(.82);
     const x=cluster?anchor.x+r.n(-270,270)*anchor.size:r.n(-30,W+30);
     const y=cluster?anchor.y+r.n(-210,210)*anchor.size:r.n(-30,H+30);
     const c=r.pick(pal),op=f(r.n(.17,.92));
     if(r.chance(.46)){
       let a=r.n(-Math.PI,Math.PI),L=r.n(4,60)*(kind==='rupture'?1.8:1),w=r.n(.5,6);
       out+=path(`M${point(x,y)}L${point(x+Math.cos(a)*L,y+Math.sin(a)*L)}`,c,w,`opacity="${op}"`);
     } else if(r.chance(.57))out+=fill(blob(x,y,r.n(1,14),r.n(1,8),r,r.int(7,11)),c,`opacity="${op}"`);
     else {const w=r.n(2,24),h=r.n(2,24),rot=r.int(-30,30);
       out+=`<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" transform="rotate(${rot} ${f(x)} ${f(y)})" fill="${c}" opacity="${op}"/>`;
     }
   }
   // An occasional dragged plate or irregular color deposit; not a tiled mosaic wallpaper.
   if(r.chance(.48)){const x=r.n(30,W-160),y=r.n(30,H-130),col=r.pick(pal),wide=r.n(115,440);
     out+=`<g opacity="${f(r.n(.11,.3))}" filter="url(#dry)">`;
     for(let i=0;i<r.int(30,110);i++){
       const xx=x+r.n(0,wide),yy=y+r.n(0,wide*.65),a=r.n(2,18);
       out+=`<rect x="${f(xx)}" y="${f(yy)}" width="${f(a)}" height="${f(a)}" fill="${col}"/>`;
     }
     out+='</g>';
   }
   return out;
 }
 function brokenStrokes(r,s,pal){
   let out='',n=Math.round((2+20*s.damage/100)*(s.density/100+.5));
   for(let j=0;j<n;j++){
     let x=r.n(-160,W+120),y=r.n(-130,H+110),angle=r.n(-Math.PI,Math.PI),total=r.n(90,560),col=r.pick(pal);
     let d=`M${point(x,y)}`;
     for(let i=0;i<r.int(3,8);i++){
       const a=angle+r.n(-.3,.3),len=total/r.n(4,10),xx=x+Math.cos(a)*len,yy=y+Math.sin(a)*len;
       d+=`Q${point((x+xx)/2+r.n(-30,30),(y+yy)/2+r.n(-30,30))} ${point(xx,yy)}`;x=xx;y=yy;
     }
     out+=path(d,col,r.n(.7,5)*(1+s.bleed/100),`stroke-dasharray="${f(r.n(6,100))} ${f(r.n(2,60))}" opacity="${f(r.n(.23,.7))}"`);
   }
   return `<g filter="url(#dry)">${out}</g>`;
 }
 function getMode(s,r){return s.mode==='chance'?r.pick(['chance','interlace','thicket','type','rupture']):s.mode;}
 O.compose=(s,painted=[])=>{
   const r=O.RNG(s.seed),base=O.palette(s.palette,r),pal=[...base],mode=getMode(s,r),bias=MODE[mode];
   if(s.palette!=='black' && base.length>2){pal.push(O.pigment(base[1],base[2],r.n(.18,.78)));pal.push(O.pigment(base[0],base[2],r.n(.15,.55)));}
   const {key,pts}=arrangement(r,s);
   let under='',mid='',upper='',top='';
   const density=s.density/100;
   const intensity=r.n(.45,1.35);
   const count=clamp(Math.round(pts.length*.9+density*2)+(mode==='type'?2:0),1,10);
   for(let i=0;i<count;i++){
     const a=pts[i%pts.length],x=a.x+r.n(-90,90),y=a.y+r.n(-70,70),size=a.size*intensity;
     const role=r.next(),rot=r.n(-180,180);
     if(role<clamp(.28+.36*bias.v*s.growth/100,.18,.92)){
       under+=O.growth(x+r.n(-220,220),y+r.n(-130,130),s,pal,r);
       if(r.chance(.43*s.growth/100*bias.v))mid+=O.growth(x+r.n(-260,260),y+r.n(-140,140),s,pal,r);
     }
     if(r.chance(clamp(.2+.55*s.knots/100*bias.k,.05,.97))){
       const cfg={density,distort:s.damage/100,bleed:s.bleed/100,misprint:s.misprint/100};
       const scale=(mode==='interlace'?Math.max(.66,r.n(.47,1.22)*size):r.n(.38,1.08)*size);
       const geom=O.knot(x,y,scale,rot,cfg,pal,r,{big:r.chance(.56)});
       if(r.chance(.55))mid+=geom;else upper+=geom;
     }
     if(r.chance(clamp(.23+.5*s.letters/100*bias.l,.02,.99)))upper+=O.letters(x+r.n(-180,180),y+r.n(-180,180),s,pal,r,i+1);
   }
   // Several independent growth swarms: inherited stroke paths also grow side branches.
   const swarms=Math.round(s.growth/100*bias.v*(1+r.n(0,4)));
   for(let i=0;i<swarms;i++)under+=O.growth(r.n(-50,W+50),r.n(-40,H+40),s,pal,r);
   for(let i=0;i<painted.length;i++){
     const stroke=painted[i];if(stroke.length>1)mid+=O.strokeVine(stroke,s,pal,O.RNG((s.seed+10291*i+47)>>>0),1.3);
   }
   if(s.letters>30&&r.chance(.7))top+=O.letters(r.n(250,1000),r.n(120,780),s,pal,r,99);
   top+=brokenStrokes(r,s,pal);
   if(s.damage>0)top+=fragments(r,s,pal,mode,pts);
   const svg=`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-label="Generative abstract ornament, knotwork, organic growth, ink and letter fragments">
    ${O.filters(s,r)}
    <!-- Intentionally transparent: no background rectangle. -->
    ${under}${mid}${upper}${top}
   </svg>`;
   return {svg,palette:pal,structure:key,mode};
 };
})(window.Ornament);
