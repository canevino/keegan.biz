/* Future-medieval botanical grammar: multiple composition families, species grammars,
   gothic/heraldic variation, and screen-age print damage. */
(function(B){
 'use strict';
 const V=(x,y)=>({x,y});
 const add=(p,q,k=1)=>V(p.x+q.x*k,p.y+q.y*k);
 const sub=(p,q)=>V(p.x-q.x,p.y-q.y);
 const N=(p)=>V(-p.y,p.x);
 const path=(points)=>`M${B.pt(points[0])} `+points.slice(1).map(p=>'L'+B.pt(p)).join(' ');
 const clamp=B.clamp;
 const templates={
   spiny:'M0 0 Q5 -6 12 -8 L16 -17 L23 -11 L29 -27 L37 -15 L44 -28 L51 -14 Q64 -11 73 0 Q63 10 51 15 L44 28 L37 16 L29 26 L23 11 L16 18 L12 8 Q4 6 0 0Z',
   lobed:'M0 0 Q8 -8 19 -13 L20 -28 Q30 -26 35 -21 L49 -35 Q57 -29 54 -19 L72 -15 Q78 -7 73 0 Q79 7 72 15 L54 20 Q58 29 49 35 L35 21 Q29 26 20 28 L19 13 Q8 9 0 0Z',
   ovate:'M0 0 C11 -12 17 -23 34 -23 C48 -24 61 -13 74 0 C60 14 48 23 34 23 C17 22 12 11 0 0Z',
   acanthus:'M0 0 Q10 -4 13 -10 L9 -25 L24 -18 L29 -35 L40 -22 L54 -33 L54 -17 L69 -22 L64 -10 Q76 -7 79 0 Q76 8 64 11 L69 22 L54 17 L54 33 L40 22 L29 35 L24 18 L9 25 L13 10 Q10 5 0 0Z',
   diamond:'M0 0 L19 -16 L39 -25 L57 -14 L70 0 L57 14 L39 25 L19 16 Z',
   lance:'M0 0 C11 -8 17 -27 29 -40 C39 -29 45 -10 56 0 C45 10 39 29 29 40 C18 27 12 8 0 0Z'
 };

 const speciesProfiles={
   holly:{template:['spiny','spiny','spiny','lobed'],flower:'berry',density:.78,spread:.86,leafScale:[.72,1.08],twig:1.05,character:'heraldic',thorny:.42},
   ivy:{template:['lobed','lobed','diamond'],flower:'none',density:.92,spread:1.1,leafScale:[.85,1.18],twig:.92,character:'climber',thorny:.05},
   oak:{template:['lobed','lobed','acanthus'],flower:'catkin',density:.68,spread:.95,leafScale:[.94,1.34],twig:1.15,character:'weighty',thorny:.06},
   hazel:{template:['ovate','ovate','lance'],flower:'catkin',density:.84,spread:1,leafScale:[.72,1.02],twig:1.05,character:'soft',thorny:.03},
   hawthorn:{template:['spiny','ovate'],flower:'berry',density:.7,spread:.88,leafScale:[.65,.95],twig:.95,character:'thorn',thorny:.5},
   dogrose:{template:['ovate','ovate','lance'],flower:'rose',density:.66,spread:1.05,leafScale:[.7,1.06],twig:.95,character:'arch',thorny:.32},
   honeysuckle:{template:['ovate','lance'],flower:'trumpet',density:.82,spread:1.12,leafScale:[.64,.92],twig:.85,character:'vine',thorny:.02},
   bramble:{template:['spiny','ovate'],flower:'berry',density:.96,spread:1.15,leafScale:[.58,.92],twig:1.08,character:'snarl',thorny:.62},
   fern:{template:['lance','ovate'],flower:'none',density:1.02,spread:.92,leafScale:[.45,.72],twig:.72,character:'ribbed',thorny:0},
   acanthus:{template:['acanthus','lobed'],flower:'fleur',density:.72,spread:.92,leafScale:[.88,1.22],twig:1,character:'manuscript',thorny:.08},
   hybrid:{template:['spiny','lobed','ovate','acanthus','diamond','lance'],flower:'mixed',density:.85,spread:1.06,leafScale:[.62,1.18],twig:1,character:'hybrid',thorny:.22},
   random:{template:['spiny','lobed','ovate','acanthus','diamond','lance'],flower:'mixed',density:.85,spread:1.06,leafScale:[.62,1.18],twig:1,character:'hybrid',thorny:.22}
 };

 function strokeShape(segments,r,p,widthStart,widthEnd,color,layer,classes=''){
   const pts=[];
   for(const seg of segments){for(let j=0;j<=36;j++)pts.push(B.cubic(...seg,j/36));}
   const L=[],R=[];
   pts.forEach((pt,i)=>{
     const t=i/(pts.length-1),before=pts[Math.max(0,i-1)],after=pts[Math.min(pts.length-1,i+1)];
     const tangent=B.unit(V(after.x-before.x,after.y-before.y)),norm=N(tangent);
     const taper=Math.pow(1-t,.78),w=Math.max(.55,widthEnd+(widthStart-widthEnd)*taper);
     const wobble=(i===0||i===pts.length-1)?0:r.float(-.55,.55)*(1-t*.6);
     L.push(add(pt,norm,w*.52+wobble));
     R.push(add(pt,norm,-w*.52+wobble));
   });
   const d=path([...L,...R.reverse()])+'Z';
   let inner='';
   for(let i=3;i<pts.length-5;i+=r.int(7,12)){
     if(!r.chance(.54))continue;
     const t=i/(pts.length-1),point=pts[i];
     const tangent=B.unit(V(pts[i+1].x-pts[i-1].x,pts[i+1].y-pts[i-1].y));
     const off=N(tangent),h=r.float(.7,2.4)*(1-t*.3);
     const x=point.x+off.x*r.float(-1,1),y=point.y+off.y*r.float(-1,1);
     inner+=`<path d="M${B.f(x)} ${B.f(y)}l${B.f(tangent.x*h)} ${B.f(tangent.y*h)}" stroke="${p.ash}" stroke-width="${B.f(r.float(.4,.95))}" opacity=".55"/>`;
   }
   layer.push(`<path class="${classes}" d="${d}" fill="${color}" stroke="${p.ink}" stroke-width=".78" stroke-linejoin="round"/>${inner}`);
   return pts;
 }
 function getTangent(seg,t){return B.unit(B.derivative(...seg,t));}
 function twig(from,to,p,r,w=1){
   const dx=to.x-from.x,dy=to.y-from.y;
   const c1=V(from.x+dx*.5+r.float(-4,4),from.y+dy*.19+r.float(-3,3));
   const c2=V(to.x-dx*.3+r.float(-3,3),to.y-dy*.34+r.float(-3,3));
   return `<path d="M${B.pt(from)} C${B.pt(c1)} ${B.pt(c2)} ${B.pt(to)}" stroke="${p.ink}" stroke-width="${B.f(1.6*w)}" stroke-linecap="round" fill="none"/>`;
 }

 function resolveStyle(settings,r){
   const species=settings.species==='random'?r.pick(['holly','ivy','oak','hazel','hawthorn','dogrose','honeysuckle','bramble','fern','acanthus','hybrid']):settings.species;
   let pattern=settings.pattern;
   if(pattern==='random') pattern=r.pick(['single','diagonal','crescent','meander','radiating','cluster']);
   let geometry=settings.geometry;
   if(geometry==='random') geometry=r.pick(['gothic-pointed','gothic-quatrefoil','celtic-double-spiral','roundel','celtic-scroll']);
   const profile=speciesProfiles[species]||speciesProfiles.hybrid;
   const mode = (settings.palette==='future' || (Number(settings.glitch)||0)>64)
     ? r.pick(['heraldic','gothic','corrupt','glow','woodcut'])
     : r.pick(['gothic','heraldic','woodcut']);
   return {species,pattern,geometry,profile,mode};
 }

 function buildSegments(pattern,r){
   const root=V(r.float(285,340), r.float(640,684));
   const segs=[];
   const mk=(a,b,c,d,branch=0)=>({a,b,c,d,branch});
   if(pattern==='single'){
     const top=V(root.x+r.float(-15,18), r.float(130,180));
     const mid=V(root.x+r.float(-16,18), r.float(360,450));
     segs.push(mk(root, V(root.x-18,590), V(mid.x-8,510), mid, 0));
     segs.push(mk(mid, V(mid.x+10,290), V(top.x-15,210), top,0));
     if(r.chance(.82)) segs.push(mk(B.cubic(root, V(root.x-18,590), V(mid.x-8,510), mid,.52), V(root.x-75,440), V(root.x-112,340), V(root.x-88,255),1));
     if(r.chance(.78)) segs.push(mk(B.cubic(mid, V(mid.x+10,290), V(top.x-15,210), top,.34), V(root.x+78,340), V(root.x+116,285), V(root.x+86,210),1));
     if(r.chance(.45)) segs.push(mk(B.cubic(mid, V(mid.x+10,290), V(top.x-15,210), top,.68), V(root.x-35,220), V(root.x-62,185), V(root.x-53,148),1));
   }else if(pattern==='diagonal' || pattern==='meander'){
     const left = pattern==='diagonal';
     const start=V(r.float(170,245), r.float(628,676));
     const end=V(r.float(380,470), r.float(110,160));
     const wave=pattern==='meander'?r.float(70,115):r.float(35,62);
     segs.push(mk(start, V(start.x+wave*.2,start.y-150), V(start.x+wave*.8,start.y-330), V(start.x+wave*1.1,start.y-440),0));
     segs.push(mk(V(start.x+wave*1.1,start.y-440), V(start.x+wave*1.45,start.y-530), V(end.x-wave*.25,end.y+60), end,0));
     segs.push(mk(B.cubic(start,V(start.x+wave*.2,start.y-150),V(start.x+wave*.8,start.y-330),V(start.x+wave*1.1,start.y-440), .42), V(start.x-100,start.y-260), V(start.x-126,start.y-360), V(start.x-100,start.y-448),1));
     if(r.chance(.8)) segs.push(mk(B.cubic(V(start.x+wave*1.1,start.y-440), V(start.x+wave*1.45,start.y-530), V(end.x-wave*.25,end.y+60), end,.35), V(end.x-55,end.y+180), V(end.x-110,end.y+225), V(end.x-128,end.y+210),1));
     if(pattern==='meander' && r.chance(.88)) segs.push(mk(B.cubic(V(start.x+wave*1.1,start.y-440), V(start.x+wave*1.45,start.y-530), V(end.x-wave*.25,end.y+60), end,.62), V(end.x+58,end.y+148), V(end.x+110,end.y+130), V(end.x+132,end.y+90),1));
   }else if(pattern==='crescent'){
     const l0=V(root.x-36, root.y), r0=V(root.x+28, root.y-6);
     segs.push(mk(l0,V(root.x-86,570),V(root.x-128,350),V(root.x-62,176),0));
     segs.push(mk(r0,V(root.x+92,594),V(root.x+138,355),V(root.x+56,146),0));
     segs.push(mk(B.cubic(l0,V(root.x-86,570),V(root.x-128,350),V(root.x-62,176),.45),V(root.x-155,420),V(root.x-183,340),V(root.x-152,250),1));
     segs.push(mk(B.cubic(r0,V(root.x+92,594),V(root.x+138,355),V(root.x+56,146),.42),V(root.x+144,410),V(root.x+178,342),V(root.x+156,260),1));
     if(r.chance(.6)) segs.push(mk(B.cubic(r0,V(root.x+92,594),V(root.x+138,355),V(root.x+56,146),.72),V(root.x+20,200),V(root.x-20,152),V(root.x-8,115),1));
   }else if(pattern==='radiating'){
     const center=V(root.x+r.float(-5,5), r.float(400,470));
     segs.push(mk(root,V(root.x-10,590),V(center.x-8,515),center,0));
     const arms=[[-148,-145],[-72,-230],[58,-250],[140,-165]];
     arms.forEach(([dx,dy],i)=>{
       const end=V(center.x+dx+r.float(-12,12), center.y+dy+r.float(-18,18));
       segs.push(mk(center,V(center.x+dx*.22+r.float(-14,14),center.y+dy*.28),V(center.x+dx*.62+r.float(-18,18),center.y+dy*.72),end,i?1:0));
     });
   }else if(pattern==='cluster'){
     const stems=r.int(3,5);
     for(let i=0;i<stems;i++){
       const start=V(root.x+r.float(-52,52),root.y+r.float(-6,6));
       const end=V(root.x+r.float(-150,150),r.float(120,260));
       segs.push(mk(start,V(start.x+r.float(-30,30),start.y-r.float(120,175)),V(end.x+r.float(-24,24),end.y+r.float(130,180)),end,i===0?0:1));
       if(r.chance(.48)){
         const branchBase=B.cubic(start,V(start.x+r.float(-30,30),start.y-r.float(120,175)),V(end.x+r.float(-24,24),end.y+r.float(130,180)),end,.46);
         segs.push(mk(branchBase,V(branchBase.x+r.float(-48,48),branchBase.y-r.float(28,60)),V(branchBase.x+r.float(-92,92),branchBase.y-r.float(88,126)),V(branchBase.x+r.float(-112,112),branchBase.y-r.float(120,160)),1));
       }
     }
   }
   return segs;
 }

 function makeLeaf(base,tip,kind,p,r,index,settings,profile,mode){
   const theta=Math.atan2(tip.y-base.y,tip.x-base.x)*180/Math.PI;
   const size=clamp(Math.hypot(tip.x-base.x,tip.y-base.y)/73,.34,1.72);
   const id=`blade-${index}`;
   const d=templates[kind]||templates.spiny;
   const ornament=(Number(settings.ornament)||50)/100;
   const distress=(Number(settings.distress)||50)/100;
   const glitch=(Number(settings.glitch)||50)/100;
   const fillMode = mode==='glow' ? B.mix(p.leaf,p.rose,.16) : mode==='corrupt' ? B.mix(p.leaf,p.ghost,.22) : p.leaf;
   const fill=B.mix(fillMode,p.deep,r.float(.12,.44));
   let bits='',print='';
   for(let k=0;k<22+Math.round(distress*64);k++){
     const x=r.float(10,70),y=r.float(-19,19),w=r.float(.7,4.6),h=r.float(.6,4.0);
     const color=r.chance(.55)?p.paper:(r.chance(.5)?p.ghost:p.ochre);
     bits+=`<rect x="${B.f(x)}" y="${B.f(y)}" width="${B.f(w)}" height="${B.f(h)}" fill="${color}" opacity="${B.f(r.float(.07,.44)*(.5+distress))}" transform="rotate(${B.f(r.float(-35,35))} ${B.f(x)} ${B.f(y)})"/>`;
   }
   if(mode==='woodcut' || mode==='gothic'){
     for(let j=0;j<4;j++){
       const x=r.float(21,58),y=r.float(-16,16),len=r.float(7,18);
       bits+=`<path d="M${B.f(x)} ${B.f(y)}l${B.f(len)} ${B.f(r.float(-3,3))}" stroke="${p.paper}" stroke-width="${B.f(r.float(.45,1.2))}" opacity="${B.f(r.float(.16,.33)*(.55+distress))}"/>`;
     }
   }
   if(r.chance(.18+.55*glitch)){
     const y=r.pick([-6,-1,5,11]),gx=r.float(26,58),block=r.float(3.5,6.4);
     for(let k=0;k<r.int(3,7);k++){
       const x=gx+k*block*.92, yy=y+Math.round(k*.65)*block*.83;
       print+=`<rect x="${B.f(x)}" y="${B.f(yy)}" width="${B.f(block)}" height="${B.f(block)}" fill="${p.paper}" opacity="${B.f(r.float(.78,1))}"/>`;
     }
     if(r.chance(.74)) print+=`<rect x="${B.f(gx+3*block)}" y="${B.f(y+block)}" width="${B.f(block)}" height="${B.f(block)}" fill="${r.chance(.5)?p.green:p.rose}" opacity=".78"/>`;
   }
   let accent='';
   if(mode==='glow' || mode==='corrupt'){
     accent=`<path d="${d}" fill="none" stroke="${mode==='glow'?p.rose:p.red}" stroke-width=".86" opacity="${B.f(.26+.3*glitch)}" transform="translate(${B.f(r.float(-1.6,1.6))},${B.f(r.float(-1.2,1.2))})"/>`;
   }
   const veinColor=B.mix(p.ochre,p.ghost,.18);
   let veins=`<path d="M7 0 Q38 ${B.f(r.float(-2,3))} 66 0" stroke="${veinColor}" stroke-width="1.14" fill="none" opacity="${B.f(.38+.34*ornament)}"/>`;
   const veinCount=kind==='lance'?5:(kind==='spiny'?4:6);
   for(let k=0;k<veinCount;k++){
     const x=17+k*8.6,yd=6+(k%2)*3;
     veins+=`<path d="M${B.f(x)} 0 l${B.f(5+r.float(0,4))} ${B.f(-yd)} M${B.f(x+3)} 0 l${B.f(5+r.float(0,4))} ${B.f(yd)}" fill="none" stroke="${veinColor}" stroke-width=".9" opacity=".62"/>`;
   }
   const edge=`<path d="${d}" fill="none" stroke="${p.ink}" stroke-width="1.36" stroke-linejoin="round" opacity=".95"/>`;
   let thorns='';
   if(profile.thorny>.2 && r.chance(profile.thorny*.8)){
     const side=r.chance(.5)?-1:1;
     thorns=`<path d="M16 ${side*2} l-7 ${side*-6} l11 ${side*1}Z M57 ${side*-2} l8 ${side*6} l-12 ${side*0}Z" fill="${p.ink}" opacity=".78"/>`;
   }
   return `<g transform="translate(${B.f(base.x)} ${B.f(base.y)}) rotate(${B.f(theta)}) scale(${B.f(size)})"><defs><clipPath id="${id}"><path d="${d}"/></clipPath></defs>
     <path d="${d}" fill="${fill}" stroke="${p.deep}" stroke-width="4.5" stroke-linejoin="round" opacity=".22" filter="url(#edge-feather)"/>
     <path d="${d}" fill="${fill}"/>
     <g clip-path="url(#${id})">${bits}${print}</g>
     ${veins}${accent}${thorns}${edge}
   </g>`;
 }

 function berryCluster(x,y,scale,tilt,p,r){
   let parts='';
   for(let i=0;i<3+r.int(0,2);i++){
     const dx=r.float(-12,12),dy=r.float(-5,8),rr=r.float(3.2,5.4);
     parts+=`<circle cx="${B.f(dx)}" cy="${B.f(dy)}" r="${B.f(rr)}" fill="${r.chance(.5)?p.red:p.rose}" stroke="${p.ink}" stroke-width=".8" opacity=".92"/><path d="M${B.f(dx)} ${B.f(dy-rr)} Q${B.f(dx-2)} ${B.f(dy-rr-5)} ${B.f(dx-6)} ${B.f(dy-rr-8)}" stroke="${p.ink}" stroke-width=".9" fill="none" opacity=".7"/>`;
   }
   return `<g transform="translate(${B.f(x)} ${B.f(y)}) rotate(${B.f(tilt)}) scale(${B.f(scale)})">${parts}</g>`;
 }
 function catkin(x,y,scale,tilt,p,r){
   let links='';
   for(let i=0;i<7;i++)links+=`<ellipse cx="0" cy="${B.f(i*5.8)}" rx="${B.f(2.2+r.float(-.6,.6))}" ry="${B.f(3.6+r.float(-.8,.8))}" fill="${i%2?p.ochre:p.ghost}" stroke="${p.ink}" stroke-width=".6" opacity=".85"/>`;
   return `<g transform="translate(${B.f(x)} ${B.f(y)}) rotate(${B.f(tilt)}) scale(${B.f(scale)})"><path d="M0 -6 Q0 8 0 14" stroke="${p.ink}" stroke-width="1" fill="none"/>${links}</g>`;
 }
 function trumpet(x,y,scale,tilt,p,r){
   const d='M0 0 Q18 -2 31 -11 Q43 -20 53 -34 Q42 -37 28 -33 Q14 -28 0 -18 Q4 -8 0 0Z';
   let wash='';
   for(let i=0;i<18;i++)wash+=`<rect x="${B.f(r.float(4,47))}" y="${B.f(r.float(-31,-3))}" width="${B.f(r.float(.5,3.2))}" height="${B.f(r.float(.4,3.4))}" fill="${r.chance(.5)?p.paper:p.ochre}" opacity="${B.f(r.float(.08,.28))}"/>`;
   return `<g transform="translate(${B.f(x)} ${B.f(y)}) rotate(${B.f(tilt)}) scale(${B.f(scale)})"><path d="${d}" fill="${p.red}" opacity=".28" filter="url(#red-run)"/><path d="${d}" fill="${B.mix(p.red,p.ochre,.18)}" stroke="${p.ink}" stroke-width=".8"/><g>${wash}</g><path d="M0 -9 Q-12 -12 -21 -18" stroke="${p.ink}" stroke-width="1.2" fill="none" opacity=".72"/></g>`;
 }
 function rose(x,y,scale,tilt,p,r,settings){
   const wear=clamp((Number(settings.distress)||45)/100,0,1);
   const color=r.chance(.3)?B.mix(p.red,p.rose,.26):p.red;
   const d=`M-8 4 Q-7 -10 -20 -24 Q-30 -28 -43 -34 Q-47 -41 -49 -47 Q-31 -50 -23 -42 Q-16 -38 -13 -31 Q-10 -47 -17 -62 Q-20 -75 -8 -81 Q-4 -92 0 -97 Q4 -92 8 -81 Q19 -75 17 -62 Q10 -47 13 -31 Q17 -38 23 -42 Q32 -51 49 -47 Q47 -41 43 -34 Q31 -28 20 -24 Q7 -10 8 4Z`;
   let flecks='';
   for(let k=0;k<36+Math.round(55*wear);k++){
     const xx=r.float(-47,47),yy=r.float(-87,-10);
     flecks+=`<rect x="${B.f(xx)}" y="${B.f(yy)}" width="${B.f(r.float(.3,3))}" height="${B.f(r.float(.4,3))}" fill="${r.chance(.7)?p.paper:p.rose}" opacity="${B.f(r.float(.10,.44))}"/>`;
   }
   return `<g transform="translate(${B.f(x)} ${B.f(y)}) rotate(${B.f(tilt)}) scale(${B.f(scale)})"><path d="${d}" fill="${p.red}" opacity=".35" filter="url(#red-run)"/><path d="${d}" fill="${color}" stroke="${p.ink}" stroke-width=".8" stroke-opacity=".45"/><g>${flecks}</g><path d="M-12 -40 Q-8 -54 0 -73 Q8 -54 12 -40 M-20 -37 Q-29 -41 -38 -43 M20 -37 Q29 -41 38 -43" stroke="${p.rose}" stroke-width="2.2" stroke-linecap="round" fill="none" opacity=".45"/><path d="M-3 1 Q0 11 1 17" stroke="${p.ink}" stroke-width="2.5" opacity=".6" fill="none"/></g>`;
 }
 function fleur(x,y,scale,tilt,p,r){
   const d='M0 -54 Q8 -72 0 -90 Q-8 -72 0 -54 M0 -54 Q16 -66 29 -63 Q22 -44 7 -35 M0 -54 Q-16 -66 -29 -63 Q-22 -44 -7 -35 M0 -26 Q14 -30 23 -18 Q14 -8 0 0 Q-14 -8 -23 -18 Q-14 -30 0 -26 Z';
   return `<g transform="translate(${B.f(x)} ${B.f(y)}) rotate(${B.f(tilt)}) scale(${B.f(scale)})"><path d="${d}" stroke="${p.ink}" stroke-width="1.2" fill="none" opacity=".78"/><path d="M0 -54 Q16 -66 29 -63 Q22 -44 7 -35 Q2 -23 0 0 Q-2 -23 -7 -35 Q-22 -44 -29 -63 Q-16 -66 0 -54Z" fill="${B.mix(p.red,p.ochre,.18)}" opacity=".92"/></g>`;
 }
 function bloomAt(x,y,scale,tilt,p,r,profile,settings){
   const type=profile.flower==='mixed'?r.pick(['rose','fleur','berry','trumpet','catkin']):profile.flower;
   if(type==='none') return '';
   if(type==='berry') return berryCluster(x,y,scale,tilt,p,r);
   if(type==='catkin') return catkin(x,y,scale,tilt,p,r);
   if(type==='trumpet') return trumpet(x,y,scale,tilt,p,r);
   if(type==='fleur') return fleur(x,y,scale,tilt,p,r);
   return rose(x,y,scale,tilt,p,r,settings);
 }

 function attachLeaf(collector,seg,t,side,span,scale,profile,p,r,settings,mode){
   const anchor=B.cubic(seg.a,seg.b,seg.c,seg.d,t),tangent=getTangent([seg.a,seg.b,seg.c,seg.d],t),normal=N(tangent);
   const swing=r.float(-.36,.36),outward=V(normal.x*side+tangent.x*swing,normal.y*side+tangent.y*swing);
   const base=add(anchor,outward,r.float(11,23)*scale*profile.twig);
   const head=add(base,B.unit(V(outward.x+tangent.x*.12,outward.y+tangent.y*.12)),r.float(span*.82,span*1.22)*scale);
   const kind=r.pick(profile.template);
   collector.leaves += twig(anchor,base,p,r,scale*.92) + makeLeaf(base,head,kind,p,r,collector.index++,settings,profile,mode);
   if(profile.thorny>.18 && r.chance(profile.thorny*.28)){
     const n=N(B.unit(sub(head,base)));
     const thorn=add(base,n,r.chance(.5)?6:-6);
     collector.leaves += `<path d="M${B.pt(thorn)} l${B.f(n.x*8)} ${B.f(n.y*8)} l${B.f(-n.x*5+tangent.x*2)} ${B.f(-n.y*5+tangent.y*2)}Z" fill="${p.ink}" opacity=".76"/>`;
   }
 }

 function distressTail(root,p,r,glitch){
   const bb=4.6; let tail='';
   for(let i=0;i<6+r.int(0,3);i++){
     tail+=`<rect x="${B.f(root.x+i*bb*.88)}" y="${B.f(root.y+i*bb*.78)}" width="${B.f(bb)}" height="${B.f(bb)}" fill="${i%3===0?p.rose:(i%2?p.deep:p.ochre)}" opacity="${B.f(.8-i*.08)}"/>`;
   }
   if(glitch>.55) for(let i=0;i<4;i++) tail+=`<rect x="${B.f(root.x-12+i*5)}" y="${B.f(root.y-12+i*4)}" width="4" height="4" fill="${i%2?p.red:p.green}" opacity=".55"/>`;
   return tail;
 }

 function draw(settings,p,r){
   const glitch=clamp(Number(settings.glitch||50)/100,0,1);
   const density=clamp(Number(settings.foliage||75)/100,.18,1.2);
   const style=resolveStyle(settings,r);
   settings._resolvedSpecies=style.species;
   settings._resolvedPattern=style.pattern;
   settings._resolvedGeometry=style.geometry;
   settings._resolvedMode=style.mode;
   const profile=style.profile;
   const segs=buildSegments(style.pattern,r);
   let wood='',leaves='',buds='';
   const stemGroups=[];
   segs.forEach((seg,i)=>{
     const q=[];
     const start=i===0?12.5:r.float(2.4,5.9)*(seg.branch?0.85:1.05);
     const end=Math.max(.75,start*(seg.branch?.22:.28));
     const strokeColor=i===0?B.mix(p.ink,p.green,.18):B.mix(p.ink,p.green,.34);
     const classes=i===0?'stem-main sway-a':(i%3===0?'sway-b':'sway-c');
     strokeShape([[seg.a,seg.b,seg.c,seg.d]],r,p,start,end,strokeColor,q,classes);
     stemGroups.push(`<g class="branch branch-${i%4}">${q.join('')}</g>`);
   });
   wood = stemGroups.join('');
   const collector={leaves:'',index:0};
   segs.forEach((seg,i)=>{
     const isMain=!seg.branch;
     const baseCount = isMain ? (3+r.int(1,4)) : (2+r.int(0,3));
     const count=Math.max(1,Math.round(baseCount*(density*profile.density)*(seg.branch?.9:1)));
     for(let j=0;j<count;j++){
       const t=clamp((j+1)/(count+1)+r.float(-.06,.06),.08,.92);
       const side=(j%2===0?1:-1)*(r.chance(.12)?-1:1);
       const span=r.float(32,68)*profile.spread*(seg.branch?.88:1.03);
       const leafScale=r.float(profile.leafScale[0],profile.leafScale[1]);
       attachLeaf(collector,seg,t,side,span,leafScale,profile,p,r,settings,style.mode);
       if((profile.character==='vine' || profile.character==='climber') && r.chance(.18)){
         const anchor=B.cubic(seg.a,seg.b,seg.c,seg.d,t);
         const tangent=getTangent([seg.a,seg.b,seg.c,seg.d],t),normal=N(tangent);
         leaves += `<path d="M${B.pt(anchor)} q${B.f(normal.x*12)} ${B.f(normal.y*12)} ${B.f(normal.x*17+tangent.x*3)} ${B.f(normal.y*17+tangent.y*3)} q${B.f(-normal.x*10)} ${B.f(-normal.y*10)} ${B.f(-normal.x*3)} ${B.f(-normal.y*3)}" stroke="${p.ink}" stroke-width=".9" fill="none" opacity=".55"/>`;
       }
     }
   });
   leaves += collector.leaves;

   // Bloom logic: not every drawing gets the same top flowers.
   if(style.pattern==='radiating'){
     segs.slice(1).forEach((seg,i)=>{
       if(r.chance(.78)) buds+=bloomAt(seg.d.x,seg.d.y+10,r.float(.55,1.02),r.float(-24,24),p,r,profile,settings);
     });
   } else {
     segs.filter((seg,i)=>i<Math.min(4,segs.length)).forEach((seg,i)=>{
       if(r.chance(i===0?.88:.62)) buds += bloomAt(seg.d.x,seg.d.y+10,r.float(.54,1.08),r.float(-16,16),p,r,profile,settings);
     });
   }
   if(style.mode==='heraldic' && r.chance(.56)){
     const sx=r.float(96,520), sy=r.float(140,570);
     buds += `<g class="sigil" transform="translate(${B.f(sx)} ${B.f(sy)}) scale(${B.f(r.float(.82,1.18))})"><path d="M0 -19L8 0L0 19L-8 0Z" fill="${p.red}" opacity=".9"/><path d="M-16 0H16 M0 -16V16" stroke="${p.rose}" stroke-width="1.2" opacity=".6"/></g>`;
   }
   const tail=distressTail(segs[0].a,p,r,glitch);
   return `<g id="plant-drift"><g class="wood-layer">${wood}</g><g class="blades-layer">${leaves}</g><g class="bloom-layer">${buds}</g>${tail}</g>`;
 }
 B.drawPlant=draw;
 B.resolveStyle=resolveStyle;
})(window.BotanicalPress);
