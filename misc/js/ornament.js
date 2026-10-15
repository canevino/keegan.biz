/* Ornament compositor: botanical manuscript ornament, carved letters, knotwork and inks.
   Each mode follows a compositional grammar; the seed varies it within that grammar. */
window.Ornament=window.Ornament||{};
((O)=>{
 'use strict';
 const {f,path,fill,rect,circle,blob,esc,clamp}=O;
 const V=(x,y)=>`${f(x)} ${f(y)}`;
 const G=(a,body,extra='')=>`<g transform="${a}" ${extra}>${body}</g>`;
 const dark=(s)=>s.pal[0],red=s=>s.pal[1],blue=s=>s.pal[2],green=s=>s.pal[3],gold=s=>s.pal[4];
 const petal=(x,y,rx,ry,rot,color,ink)=>`<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" transform="rotate(${f(rot)} ${f(x)} ${f(y)})" fill="${color}" stroke="${ink}" stroke-width=".75"/>`;
 function inked(d,color,s,width=1.2){return `<path d="${d}" fill="${color}" stroke="${dark(s)}" stroke-width="${f(width)}" stroke-linejoin="round"/>`}
 function hatch(x,y,w,h,r,s,n=9){let z='';for(let i=0;i<n;i++){let xx=x+r.n(0,w),yy=y+r.n(0,h);z+=path(`M${V(xx,yy)}l${f(r.n(-2.5,2.5))} ${f(r.n(2,11))}`,dark(s),r.n(.35,.9),`opacity="${f(r.n(.27,.68))}"`)}return z;}
 function acanthus(x,y,len,ang,s,r,kind=0){
   let width=len*r.n(.19,.32),rake=r.n(-.13,.16)*len,tip=-(len*r.n(.9,1.13));
   const L=width, T=tip;
   let d= kind===1 ? `M0 0 C${f(-L*.45)} ${f(T*.1)} ${f(-L*.45)} ${f(T*.33)} ${f(-L*.95)} ${f(T*.42)} L${f(-L*.25)} ${f(T*.53)} Q${f(-L*1.24)} ${f(T*.66)} ${f(-L*.87)} ${f(T*.78)} Q${f(-L*.6)} ${f(T*.93)} ${f(rake)} ${f(T)} Q${f(L*.6)} ${f(T*.79)} ${f(L*.94)} ${f(T*.65)} L${f(L*.23)} ${f(T*.6)} Q${f(L*1.05)} ${f(T*.4)} ${f(L*.5)} ${f(T*.25)} Q${f(L*.23)} ${f(T*.07)} 0 0 Z` : `M0 0 C${f(-L*.35)} ${f(T*.15)} ${f(-L*1.15)} ${f(T*.4)} ${f(-L*.95)} ${f(T*.53)} Q${f(-L*.74)} ${f(T*.66)} ${f(rake)} ${f(T)} Q${f(L*.45)} ${f(T*.84)} ${f(L*1.05)} ${f(T*.57)} C${f(L*1.4)} ${f(T*.35)} ${f(L*.42)} ${f(T*.1)} 0 0Z`;
   let shade=r.pick([green(s),green(s),red(s),blue(s),O.pigment(green(s),gold(s),.30)]);
   let z=inked(d,shade,s,.75)+path(`M0 0 Q${f(len*.09)} ${f(T*.52)} ${f(rake)} ${f(T)}`,O.pigment(gold(s),dark(s),.28),.8,'opacity=".85"');
   for(let i=0;i<6;i++){let t=.19+i*.115;z+=path(`M${f(2)} ${f(T*t)}q${f(L*.28)} ${f(-len*.06)} ${f(L*.63*(1-t))} ${f(-len*.073)}`,dark(s),.39,'opacity=".58"');if(i%2===0)z+=path(`M${f(-2)} ${f(T*t)}q${f(-L*.23)} ${f(-len*.03)} ${f(-L*.42*(1-t))} ${f(-len*.082)}`,gold(s),.37,'opacity=".72"');}for(let i=0;i<5;i++){let px=r.n(-L*.55,L*.55),py=T*r.n(.22,.82);z+=circle(px,py,r.n(.35,1.1),dark(s),`opacity="${f(r.n(.18,.35))}"`);}
   return G(`translate(${V(x,y)}) rotate(${f(ang)})`,z);
 }
 function bud(x,y,rad,s,r){let z='';let num=r.pick([3,4,5]);for(let i=0;i<num;i++){let a=i*360/num+r.n(-8,8),aRad=a*Math.PI/180;let cx=Math.cos(aRad)*rad*.5,cy=Math.sin(aRad)*rad*.5;z+=petal(cx,cy,rad*.20,rad*.64,a, r.pick([red(s),blue(s),gold(s)]),dark(s));}z+=circle(0,0,rad*.23,gold(s),`stroke="${dark(s)}" stroke-width=".9"`);return G(`translate(${V(x,y)}) rotate(${f(r.n(-18,18))})`,z);}
 function thorn(x,y,angle,size,s){return G(`translate(${V(x,y)}) rotate(${f(angle)})`,fill(`M0 0 Q${f(-size*.2)} ${f(-size*.7)} ${f(size*.32)} ${f(-size)} Q${f(size*.21)} ${f(-size*.35)} 0 0Z`,dark(s)))}
 function spiral(x,y,rad,s,r,col){let turns=r.n(1.5,2.6),steps=38,pts=[];for(let i=0;i<=steps;i++){let t=i/steps,a=t*turns*2*Math.PI+r.n(-.01,.01),rr=rad*(.1+.87*t);pts.push([x+Math.cos(a)*rr,y+Math.sin(a)*rr]);}let d='M'+V(...pts[0])+pts.slice(1).map(p=>'L'+V(...p)).join('');return path(d,col||dark(s),r.n(.75,1.75),'stroke-linecap="round"');}
 // One botanical stem follows a cubic guide, with paired acanthus growth and tendrils.
 function vine(x,y,length,ang,s,r,opts={}){
   let density=s.foliage/100;let count=Math.round((9+27*density)*r.n(.78,1.24));if(density===0)count=0;
   let bend=r.n(-61,61),wave=r.n(-42,42),w=opts.weight||1;
   let spine=`M0 0 C${f(bend)} ${f(-length*.28)} ${f(wave)} ${f(-length*.75)} ${f(r.n(-15,15))} ${f(-length)}`;
   let z=path(spine,dark(s),3.5*w,'opacity=".95"')+path(spine,green(s),1.5*w,'opacity=".89"');
   for(let i=0;i<count;i++){
     let t=(i+.48)/count;let yy=-length*t;let xx=bend*3*t*(1-t)+wave*t*t*.25;let side=((i%2)?1:-1)*(opts.side||1);let reach=r.n(31,82)*(.56+.72*density)*w;let by=yy-r.n(22,46);let bx=xx+side*reach;
     z+=path(`M${V(xx,yy)}Q${V(xx+side*reach*.56,yy-4)} ${V(bx,by)}`,dark(s),r.n(.7,1.2)*w);
     z+=acanthus(bx,by,r.n(33,70)*w,side>0?37:-37,s,r,r.int(0,1));
     if(r.chance(.79))z+=acanthus(xx+side*reach*.48,yy-7,r.n(24,52)*w,side>0?105:-105,s,r,r.int(0,1));
     if(r.chance(.24+.24*density))z+=bud(bx+r.n(-4,4),by-r.n(13,24),r.n(7,13)*w,s,r);
     if(r.chance(.45))z+=spiral(bx,by,r.n(9,21)*w,s,r);
     if(r.chance(.27))z+=thorn(bx,by,side*50,r.n(6,12),s);
   }
   return G(`translate(${V(x,y)}) rotate(${f(ang)})`,z,`filter="url(#ink)"`);
 }
 function vineArc(x1,y1,x2,y2,s,r,weight=1){let l=Math.hypot(x2-x1,y2-y1),a=Math.atan2(y2-y1,x2-x1)*180/Math.PI+90;return vine(x1,y1,l,a,s,r,{weight});}
 // An engraved, twining initial without rectangular clip-art label/background.
 function initial(x,y,size,s,r,ch){
   let paper=O.pigment(s.pal[5],'#ffffff',.2);let e=esc((ch||'A').toUpperCase().slice(0,1));
   let base=`<text x="0" y="0" text-anchor="middle" font-family="Georgia,Times New Roman,serif" font-weight="bold" font-size="${f(size)}" fill="url(#gilt)" stroke="${dark(s)}" stroke-width="${f(size*.014)}" paint-order="stroke fill">${e}</text>`;
   let etch=`<text x="${f(size*.008)}" y="${f(-size*.006)}" text-anchor="middle" font-family="Georgia,Times New Roman,serif" font-weight="bold" font-size="${f(size)}" fill="none" stroke="${s.pal[5]}" stroke-width="${f(size*.0034)}" opacity=".85">${e}</text>`;
   let etchCut=`<clipPath id="initial-clip"><text x="0" y="0" text-anchor="middle" font-family="Georgia,Times New Roman,serif" font-weight="bold" font-size="${f(size)}">${e}</text></clipPath>`;let worn=`<g clip-path="url(#initial-clip)">`;for(let j=0;j<Math.floor(15+s.wear*.8);j++){let px=r.n(-size*.35,size*.35),py=r.n(-size*.82,-size*.04),w=r.n(.4,2.3),c=r.pick([dark(s),red(s),O.pigment(gold(s),red(s),.35)]);worn+=path(`M${V(px,py)}l${f(r.n(-7,7))} ${f(r.n(-2,10))}`,c,w,`opacity="${f(r.n(.13,.39))}"`);}worn+='</g>';let ornaments='';let n=5+Math.floor(s.foliage/17);for(let i=0;i<n;i++){
    let t=i/(n-1),dir=(i%2?1:-1),ax=(dir<0?-size*.23:size*.23)+r.n(-size*.075,size*.075),ay=-size*(.10+t*.68);ornaments+=spiral(ax,ay,size*r.n(.025,.07),s,r,dir>0?green(s):red(s));
    if(r.chance(.7))ornaments+=acanthus(ax+r.n(-9,9),ay,size*r.n(.055,.10),r.n(-100,100),s,r,1);
   }
   return G(`translate(${V(x,y)}) rotate(${f(r.n(-6,6))})`,G('',etchCut+base+worn+etch)+ornaments,`filter="url(#blot)"`);
 }
 function medallion(x,y,radius,s,r){let out='';let n=r.pick([6,8,10]);out+=circle(x,y,radius,'none',`stroke="${dark(s)}" stroke-width="2.3"`);out+=circle(x,y,radius-6,'none',`stroke="${gold(s)}" stroke-width="3.2"`);
  for(let i=0;i<n;i++){let a=(i+.5)*2*Math.PI/n;out+=acanthus(x+Math.cos(a)*radius*.85,y+Math.sin(a)*radius*.85,radius*.3,a*180/Math.PI+90,s,r,1);}out+=circle(x,y,radius*.2,gold(s),`stroke="${dark(s)}" stroke-width="1.2"`);return out;}
 function knots(x,y,scale,rotation,s,r,big=false){if(s.knots<=0)return '';let settings={density:.27+s.knots/160,distort:s.wear/300,misprint:s.wear/400};return O.knot(x,y,scale,rotation,settings,[dark(s),blue(s),red(s),gold(s),green(s)],r,{big});}
 function knotBand(y,s,r,len=4){let out='';for(let i=0;i<len;i++)out+=knots(175+i*150+r.n(-14,14),y+r.n(-5,5),.26,0,s,r);return out;}
 function pigmentField(x,y,w,h,s,r){if(s.pigment<4)return '';let z='';let n=Math.floor((s.pigment/100)*130);let patch=blob(x,y,w*.5,h*.5,r,20);
  z+=`<clipPath id="p-${f(x)}-${f(y)}"><path d="${patch}"/></clipPath>`;let cols=r.int(8,17),rows=r.int(8,19),cw=w/cols,ch=h/rows;
  z+=`<g clip-path="url(#p-${f(x)}-${f(y)})" opacity="${f(.21+.35*s.pigment/100)}">`;
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++)if(r.chance(.34+.4*s.pigment/100)){
   let col=r.pick([red(s),blue(s),green(s),gold(s),dark(s)]),noise=r.n(.3,1);z+=rect(x-w/2+i*cw,y-h/2+j*ch,cw*noise,ch*noise,col,`opacity="${f(r.n(.55,.95))}"`);
  }
  z+='</g>';for(let i=0;i<n;i++){let xx=x+r.n(-w*.48,w*.48),yy=y+r.n(-h*.43,h*.43),col=r.pick([red(s),blue(s),green(s),gold(s)]);if(r.chance(.32))z+=rect(xx,yy,r.n(1,6),r.n(1,7),col,`opacity="${f(r.n(.2,.52))}"`)}
  return z;
 }
 function manuscriptText(x,y,s,r,rows){if(s.letters===0)return '';let words=['folia','umbra','lignum','ordo','fervor','lumen','mora','silva','VI','alba','xv','noctis','verum','flora','in situ','memento','†','✣'];
  let out='',n=Math.max(1,Math.floor(rows*s.letters/100));for(let i=0;i<n;i++){
   let xx=x+r.n(-25,25),yy=y+i*r.n(22,36),str=r.pick(words),rot=r.n(-6,6)*s.wear/85,size=r.n(15,27);let col=r.pick([dark(s),dark(s),red(s)]);
   out+=G(`translate(${V(xx,yy)}) rotate(${f(rot)})`,`<text x="0" y="0" font-family="Georgia,Times New Roman,serif" font-size="${f(size)}" font-style="${r.chance(.25)?'italic':'normal'}" font-weight="${r.chance(.3)?700:400}" fill="${col}" letter-spacing="-${f(r.n(.2,.7))}">${esc(str)}</text>`,`filter="url(#dry)"`);
  }return out;
 }
 function engraving(x,y,w,h,s,r){let z='';let n=Math.round((s.wear/100)*75);for(let i=0;i<n;i++){
  let xx=x+r.n(0,w),yy=y+r.n(0,h);if(r.chance(.6))z+=path(`M${V(xx,yy)}l${f(r.n(-5,5))} ${f(r.n(-4,8))}`,r.pick([dark(s),red(s),gold(s)]),r.n(.3,.9),`opacity="${f(r.n(.18,.45))}"`);
  else z+=circle(xx,yy,r.n(.3,1.4),r.pick([dark(s),red(s),blue(s)]),`opacity="${f(r.n(.12,.45))}"`);
 }return z;}
 function borderMotif(x,y,w,h,s,r){let z='';let n=22+Math.round(s.foliage/6);z+=path(`M${V(x,y+h)}Q${V(x-36,y+h*.5)} ${V(x+5,y)} Q${V(x+w*.5,y-18)} ${V(x+w,y+6)}`,dark(s),1.6);
  for(let i=0;i<n;i++){let t=i/(n-1),xx=x+5+Math.sin(t*13)*10,yy=y+(1-t)*h;let len=r.n(12,26);z+=acanthus(xx,yy,len,r.n(-70,70),s,r,r.int(0,1));}
  return z;}
 function composition(mode,s,r){let art='';let weights={marginalia:1,initial:.7,interlace:.8,chromatic:1.1};let d=s.foliage/100;
  // Intentional fields, not random scribbles. The entire layout can shift between generations.
  if(mode==='marginalia'){
    let dx=r.n(-55,55),dy=r.n(-50,45);let tilt=r.n(-4,4);
    art+=G(`translate(${f(dx)} ${f(dy)}) rotate(${f(tilt)} 440 510)`,
      pigmentField(260,345,240,350,s,r)+pigmentField(620,720,260,330,s,r)+
      (d? vine(132,855,720,r.n(-7,7),s,r,{weight:1.04}):'')+
      (d? vine(725,895,750,r.n(-5,5),s,r,{weight:1.1,side:-1}):'')+
      (d>.3?vineArc(170,914,695,890,s,r,.9):'')+
      (d>.4?vineArc(142,231,735,226,s,r,.66):'')+
      (d>.52?vine(265,645,480,r.n(-17,7),s,r,{weight:.63}):'')+
      (s.showInitial?initial(r.n(330,490),r.n(560,655),r.n(300,395),s,r,s.initial):'')+
      (s.knots>0?knots(r.n(565,650),r.n(275,360),r.n(.4,.64),r.n(-24,24),s,r):'')+
      (s.knots>40?medallion(253,784,45,s,r):'')+
      manuscriptText(306,875,s,r,5));
  }else if(mode==='initial'){
    let p=r.pick([[415,640,480],[455,610,520],[390,610,420]]);
    art+=pigmentField(460,550,550,650,s,r)+
      (s.showInitial?initial(p[0],p[1],p[2],s,r,s.initial):'')+
      (d?vine(215,855,710,r.n(-21,-8),s,r):'')+
      (d>.38?vineArc(225,920,724,837,s,r,.8):'')+
      (d>.25?vine(710,760,590,r.n(0,24),s,r,{weight:.78}):'')+
      (s.knots>5?knots(r.n(575,680),r.n(745,890),r.n(.4,.60),r.n(-17,18),s,r):'')+
      (s.knots>65?knots(315,165,.28,0,s,r):'')+
      manuscriptText(280,927,s,r,4);
  }else if(mode==='interlace'){
    art+=(s.knots>0?knots(430,510,r.n(.95,1.32),r.n(-5,5),s,r,true):'')+
      (s.knots>28?knots(440,185,.55,r.n(-9,9),s,r):'')+
      (s.knots>45?knots(440,850,.52,r.n(-9,9),s,r):'')+
      pigmentField(436,535,480,760,s,r)+
      (d?vine(155,955,810,-6,s,r,{weight:.85}):'')+
      (d?vine(738,980,830,8,s,r,{weight:.8}):'')+
      (s.showInitial?initial(175,288,r.n(130,200),s,r,s.initial):'')+
      manuscriptText(235,945,s,r,3);
  }else{
    // Ink blocks remain inside shaped pigment fields; empty paper stays transparent.
    let p=s.pigment;art+=pigmentField(365,280,530,410,s,r)+pigmentField(510,630,620,480,s,r)+pigmentField(300,815,430,320,s,r);
    if(p>35){let cc=r.pick([red(s),blue(s),green(s)]);art+=fill(blob(490,404,230,165,r,15),cc,`opacity="${f(.06+.16*p/100)}"`);}
    if(d)for(let i=0;i<3+Math.round(d*3);i++){
       let x=r.n(120,745),y=r.n(760,1040),l=r.n(390,710);art+=vine(x,y,l,r.n(-35,37),s,r,{weight:r.n(.65,1.35)});
    }
    if(s.showInitial)art+=initial(r.n(380,510),r.n(450,585),r.n(330,450),s,r,s.initial);
    if(s.knots>0)art+=knots(r.n(240,640),r.n(730,885),r.n(.4,.69),r.n(-20,25),s,r);
    art+=manuscriptText(310,960,s,r,7);
  }
  art+=engraving(90,90,700,870,s,r);return art;
 }
 function render(settings){let s={...settings},r=O.RNG(s.seed);s.pal=O.palette(s.palette,r);const mode=s.mode;let out=O.filters(s,r);out+=`<g id="ornament" filter="url(#blot)">${composition(mode,s,r)}</g>`;
   return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 880 1040" width="880" height="1040" role="img" aria-label="Generative ornamental artwork" preserveAspectRatio="xMidYMid meet">${out}</svg>`;
 }
 O.render=render;
 // One small foliate mark in the landing area, rendered without depending on UI.
 O.intro=()=>{let r=O.RNG(72281),s={pal:O.palettes.insular,foliage:50,wear:10,bleed:true};return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 330 350">${O.filters(s,r)}${vine(145,302,260,21,s,r,{weight:.7})}${spiral(181,88,25,s,r)}</svg>`};
})(window.Ornament);
