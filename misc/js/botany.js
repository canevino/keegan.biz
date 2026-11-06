/* Authored botanical grammar: stems, gothic leaves and fleur-like blooms.
   A seed changes the specimen without destroying the visual hierarchy. */
(function(B){
 'use strict';
 const V=(x,y)=>({x,y});
 const add=(p,q,k=1)=>V(p.x+q.x*k,p.y+q.y*k);
 const N=(p)=>V(-p.y,p.x);
 const path=(points)=>`M${B.pt(points[0])} `+points.slice(1).map(p=>'L'+B.pt(p)).join(' ');

 const templates={
   spiny:'M0 0 Q5 -6 12 -8 L16 -17 L23 -11 L29 -27 L37 -15 L44 -28 L51 -14 Q64 -11 73 0 Q63 10 51 15 L44 28 L37 16 L29 26 L23 11 L16 18 L12 8 Q4 6 0 0Z',
   lobed:'M0 0 Q8 -8 19 -13 L20 -28 Q30 -26 35 -21 L49 -35 Q57 -29 54 -19 L72 -15 Q78 -7 73 0 Q79 7 72 15 L54 20 Q58 29 49 35 L35 21 Q29 26 20 28 L19 13 Q8 9 0 0Z',
   ovate:'M0 0 C11 -12 17 -23 34 -23 C48 -24 61 -13 74 0 C60 14 48 23 34 23 C17 22 12 11 0 0Z',
   acanthus:'M0 0 Q10 -4 13 -10 L9 -25 L24 -18 L29 -35 L40 -22 L54 -33 L54 -17 L69 -22 L64 -10 Q76 -7 79 0 Q76 8 64 11 L69 22 L54 17 L54 33 L40 22 L29 35 L24 18 L9 25 L13 10 Q10 5 0 0Z'
 };
 const C=(c)=>B.f(c);
 function strokeShape(segments,r,p,widthStart,widthEnd,color,layer){
   const pts=[];
   for(const seg of segments){for(let j=0;j<=32;j++)pts.push(B.cubic(...seg,j/32));}
   // One continuous, tapered silhouette: not disconnected strokes.
   const L=[],R=[];
   pts.forEach((p,i)=>{
     const t=i/(pts.length-1),before=pts[Math.max(0,i-1)],after=pts[Math.min(pts.length-1,i+1)];
     const tangent=B.unit(V(after.x-before.x,after.y-before.y)),norm=N(tangent);
     const taper=Math.pow(1-t,.78),w=Math.max(.55,widthEnd+(widthStart-widthEnd)*taper);
     const wobble=(i===0||i===pts.length-1)?0:r.float(-.55,.55)*(1-t*.6);
     L.push(add(p,norm,w*.52+wobble));R.push(add(p,norm,-w*.52+wobble));
   });
   const d=path([...L,...R.reverse()])+'Z';
   let inner='';
   // Thin worn score and tiny speckled interruptions follow the wood grain.
   for(let i=3;i<pts.length-5;i+=r.int(7,12)){
     if(!r.chance(.55))continue;
     const t=i/(pts.length-1),point=pts[i];
     const tangent=B.unit(V(pts[i+1].x-pts[i-1].x,pts[i+1].y-pts[i-1].y));
     const off=N(tangent),h=r.float(.7,2.4)*(1-t*.3);
     const x=point.x+off.x*r.float(-1,1),y=point.y+off.y*r.float(-1,1);
     inner+=`<path d="M${C(x)} ${C(y)}l${C(tangent.x*h)} ${C(tangent.y*h)}" stroke="${p.ash}" stroke-width="${C(r.float(.4,.95))}" opacity=".55"/>`;
   }
   layer.push(`<path d="${d}" fill="${color}" stroke="${p.ink}" stroke-width=".78" stroke-linejoin="round"/>${inner}`);
   return pts;
 }
 function getTangent(seg,t){return B.unit(B.derivative(...seg,t));}
 function twig(from,to,p,r){
   const dx=to.x-from.x,dy=to.y-from.y;
   const c1=V(from.x+dx*.5+r.float(-4,4),from.y+dy*.19+r.float(-3,3));
   const c2=V(to.x-dx*.3+r.float(-3,3),to.y-dy*.34+r.float(-3,3));
   return `<path d="M${B.pt(from)} C${B.pt(c1)} ${B.pt(c2)} ${B.pt(to)}" stroke="${p.ink}" stroke-width="1.7" stroke-linecap="round" fill="none"/>`;
 }
 function makeLeaf(base,tip,kind,p,r,index,settings){
   const theta=Math.atan2(tip.y-base.y,tip.x-base.x)*180/Math.PI;
   const size=B.clamp(Math.hypot(tip.x-base.x,tip.y-base.y)/73,.40,1.55);
   const id=`blade-${index}`;
   const leafKind=kind==='mix'?r.pick(['spiny','spiny','lobed','acanthus','ovate']):kind==='fern'?'ovate':kind;
   const d=templates[leafKind]||templates.spiny;
   const green = r.chance(.25)?B.mix(p.leaf,p.ghost,.18):p.leaf;
   const fill=B.mix(green,p.deep,r.float(.12,.42));
   const ornament=(Number(settings.ornament)||50)/100;
   const distress=(Number(settings.distress)||50)/100;
   const glitch=(Number(settings.glitch)||50)/100;
   let bits='',print='';
   // Pigment is constrained to the leaf, with varying pressure and pinholes.
   for(let k=0;k<27+Math.round(distress*57);k++){
     const x=r.float(10,70),y=r.float(-19,19),w=r.float(.7,4),h=r.float(.6,3.6);
     const color=r.chance(.62)?p.paper:(r.chance(.5)?p.ghost:p.ochre);
     bits+=`<rect x="${C(x)}" y="${C(y)}" width="${C(w)}" height="${C(h)}" fill="${color}" opacity="${C(r.float(.09,.43)*(.4+distress))}" transform="rotate(${C(r.float(-35,35))} ${C(x)} ${C(y)})"/>`;
   }
   for(let j=0;j<3;j++){
     const x=r.float(26,60),y=r.float(-15,15);
     bits+=`<path d="M${C(x-4)} ${C(y)}l${C(r.float(4,11))} ${C(r.float(-2,3))}" stroke="${p.paper}" stroke-width="${C(r.float(.45,1.2))}" opacity="${C(r.float(.10,.28)*(.5+distress))}"/>`;
   }
   // Print misregistration and square missing-ink patches, sparingly.
   if(r.chance(.22+.43*glitch)){
     const y=r.pick([-1,5,-6,11]),gx=r.float(37,54),block=r.float(3.8,6.0);
     for(let k=0;k<r.int(4,7);k++){
       const x=gx+k*block*.94, yy=y+Math.round(k*.65)*block*.85;
       print+=`<rect x="${C(x)}" y="${C(yy)}" width="${C(block)}" height="${C(block)}" fill="${p.paper}" opacity="${C(r.float(.83,1))}"/>`;
     }
     print+=`<rect x="${C(gx+3*block)}" y="${C(y+3*block)}" width="${C(block)}" height="${C(block)}" fill="${r.chance(.5)?p.green:p.rose}" opacity=".8"/>`;
   }
   // Heraldic leaf veins intentionally graphic, not photographic.
   const veinColor=B.mix(p.ochre,p.ghost,.22);
   let veins=`<path d="M7 0 Q38 ${C(r.float(-2,3))} 66 0" stroke="${veinColor}" stroke-width="1.28" fill="none" opacity="${C(.48+.28*ornament)}"/>`;
   for(let k=0;k<4;k++){
     const x=21+k*11,yd=7+(k%2)*3;
     veins+=`<path d="M${x} 0 l${C(6+r.float(0,4))} ${C(-yd)} M${x+3} 0 l${C(6+r.float(0,4))} ${C(yd)}" fill="none" stroke="${veinColor}" stroke-width=".95" opacity=".65"/>`;
   }
   const edge=`<path d="${d}" fill="none" stroke="${p.ink}" stroke-width="1.45" stroke-linejoin="round" opacity=".93"/>`;
   const reg=(r.chance(.20*glitch))?`<path d="${d}" fill="none" stroke="${p.rose}" stroke-width=".85" opacity=".44" transform="translate(1.5,-.9)"/>`:'';
   return `<g transform="translate(${C(base.x)} ${C(base.y)}) rotate(${C(theta)}) scale(${C(size)})">
     <defs><clipPath id="${id}"><path d="${d}"/></clipPath></defs>
     <path d="${d}" fill="${fill}" stroke="${p.deep}" stroke-width="4.5" stroke-linejoin="round" opacity=".22" filter="url(#edge-feather)"/>
     <path d="${d}" fill="${fill}"/>
     <g clip-path="url(#${id})"><path d="M15 -35 Q36 -17 48 -35 L78 -19 L80 28 Q52 8 43 30 L15 35Z" fill="${p.green}" opacity=".18"/>${bits}${print}</g>
     ${veins}${reg}${edge}
   </g>`;
 }
 function flower(x,y,scale,tilt,p,r,index,settings){
   const wear=B.clamp((Number(settings.distress)||45)/100,0,1);
   const color=r.chance(.3)?B.mix(p.red,p.rose,.26):p.red;
   const d=`M-8 4 Q-7 -10 -20 -24 Q-30 -28 -43 -34 Q-47 -41 -49 -47 Q-31 -50 -23 -42 Q-16 -38 -13 -31 Q-10 -47 -17 -62 Q-20 -75 -8 -81 Q-4 -92 0 -97 Q4 -92 8 -81 Q19 -75 17 -62 Q10 -47 13 -31 Q17 -38 23 -42 Q32 -51 49 -47 Q47 -41 43 -34 Q31 -28 20 -24 Q7 -10 8 4Z`;
   let flecks='';
   for(let k=0;k<40+Math.round(55*wear);k++){
     const xx=r.float(-47,47),yy=r.float(-87,-10);
     flecks+=`<rect x="${C(xx)}" y="${C(yy)}" width="${C(r.float(.3,3))}" height="${C(r.float(.4,3))}" fill="${r.chance(.7)?p.paper:p.rose}" opacity="${C(r.float(.10,.44))}"/>`;
   }
   let drips='';
   for(let k=0;k<5;k++){
     const dx=r.float(-32,33),dy=r.float(-36,-18),len=r.float(10,33)*(.7+wear);
     drips+=`<path d="M${C(dx)} ${C(dy)} Q${C(dx-2)} ${C(dy+len*.65)} ${C(dx+r.float(-2,2))} ${C(dy+len)}" fill="none" stroke="${color}" stroke-width="${C(r.float(.7,2.1))}" opacity="${C(.14+r.float(.14,.32))}" stroke-linecap="round"/>`;
   }
   const marks=`<path d="M-12 -40 Q-8 -54 0 -73 Q8 -54 12 -40 M-20 -37 Q-29 -41 -38 -43 M20 -37 Q29 -41 38 -43" stroke="${p.rose}" stroke-width="2.2" stroke-linecap="round" fill="none" opacity=".45"/>`;
   return `<g transform="translate(${C(x)} ${C(y)}) rotate(${C(tilt)}) scale(${C(scale)})">
     <defs><clipPath id="flower-${index}"><path d="${d}"/></clipPath></defs>
     <path d="${d}" fill="${p.red}" opacity=".35" filter="url(#red-run)"/>
     <path d="${d}" fill="${color}" stroke="${p.ink}" stroke-width=".8" stroke-opacity=".45"/>
     <g clip-path="url(#flower-${index})">${flecks}</g>${marks}${drips}
     <path d="M-3 1 Q0 11 1 17" stroke="${p.ink}" stroke-width="2.5" opacity=".6" fill="none"/>
   </g>`;
 }
 function draw(settings,p,r){
   const growth=settings.pattern;
   const lean = growth==='diagonal'?23:growth==='meander'?-14:growth==='crescent'?9:growth==='radiating'?-11:0;
   const stretch = growth==='cluster'?.87:growth==='single'?1.08:1;
   const offset=(x,y)=>V(
     310+(x-310)*stretch+(710-y)/710*lean + r.float(-11,11)*(.38+(710-y)/1050),
     y+r.float(-6,6)
   );
   const lower=[offset(302,669),offset(259,599),offset(282,519),offset(327,466)];
   const middle=[lower[3],offset(388,378),offset(270,302),offset(355,219)];
   const upper=[middle[3],offset(386,181),offset(370,142),offset(350,125)];
   const fromL=B.cubic(...lower,.51),fromR=B.cubic(...middle,.43);
   const left=[fromL,offset(237,522),offset(159,468),offset(157,388)];
   const leftTop=[left[3],offset(153,373),offset(153,358),offset(158,346)];
   const right=[fromR,offset(385,394),offset(462,450),offset(463,377)];
   const rightTop=[right[3],offset(463,365),offset(462,355),offset(469,346)];
   const small=[B.cubic(...middle,.72),offset(284,247),offset(247,235),offset(225,206)];
   const stems=[{s:[lower,middle,upper],start:13,end:2.6},{s:[left,leftTop],start:6.3,end:1.25},{s:[right,rightTop],start:5.2,end:1.3},{s:[small],start:3.3,end:.8}];
   let wood='',leaves='',buds='';
   stems.forEach((stem,i)=>{const q=[];strokeShape(stem.s,r,p,stem.start,stem.end,i===0?B.mix(p.ink,p.green,.2):B.mix(p.ink,p.green,.38),q);wood+=q.join('');});
   const density=B.clamp(Number(settings.foliage||75)/100,.25,1);
   const species=B.styles[settings.species]||'mix';
   let index=0;
   function attach(seg,t,side,span,scale=1){
     if(r.random()>.28+(density*.78))return;
     const anchor=B.cubic(...seg,t),tangent=getTangent(seg,t),normal=N(tangent);
     const swing=r.float(-.27,.27);
     const outward=V(normal.x*side+tangent.x*swing,normal.y*side+tangent.y*swing);
     const base=add(anchor,outward,r.float(12,22)*scale);
     const head=add(base,B.unit(V(outward.x+tangent.x*.13,outward.y+tangent.y*.13)),r.float(span*.83,span*1.18)*scale);
     const leafKind=species==='mix'?r.pick(['spiny','spiny','lobed','acanthus','ovate']):species;
     const bladeSize=1;
     leaves+=twig(anchor,base,p,r)+makeLeaf(base,head,leafKind,p,r,index++,settings);
   }
   // The main stem carries a few large leaves. Supporting shoots are not a bushy noise field.
   const row=[[lower,.18,1,60,1],[lower,.35,-1,65,.97],[lower,.60,1,65,1],
              [middle,.10,-1,60,1],[middle,.24,1,61,.9],[middle,.41,-1,67,1.1],
              [middle,.62,1,64,1],[middle,.81,-1,58,.95],
              [upper,.36,1,51,.83],[upper,.69,-1,49,.75],
              [left,.13,1,50,.8],[left,.35,-1,68,1.05],[left,.54,1,58,.9],[left,.72,-1,49,.72],
              [right,.12,-1,57,.85],[right,.30,1,65,1],[right,.50,-1,53,.85],[right,.69,1,47,.7],
              [small,.42,1,49,.7]];
   row.forEach(q=>attach(...q));
   // Small leaflets only when density is high; don't carpet-bomb the silhouette.
   if(density>.72){[[upper,.16,-1,36,.55],[right,.77,-1,34,.55],[left,.85,1,33,.5]].forEach(q=>attach(...q));}
   const season=settings.season;
   const flowers = season==='winter' ? 0 : season==='autumn'?2:3;
   if(flowers>0){
     buds+=flower(upper[3].x,upper[3].y+14,1.03,-4,p,r,1,settings);
     buds+=flower(leftTop[3].x,leftTop[3].y+15,.88,-12,p,r,2,settings);
     if(flowers>2) buds+=flower(rightTop[3].x,rightTop[3].y+15,.88,11,p,r,3,settings);
   }else{
     // Winter: black-red seedheads take the place of missing flowers.
     for(const [j,st] of [upper[3],leftTop[3],rightTop[3]].entries()){
       buds+=`<g fill="${p.red}" stroke="${p.deep}" stroke-width="1"><circle cx="${C(st.x)}" cy="${C(st.y)}" r="3.4"/><circle cx="${C(st.x-5)}" cy="${C(st.y+3)}" r="2.7"/><circle cx="${C(st.x+5)}" cy="${C(st.y+2)}" r="2.9"/></g>`;
     }
   }
   // A few intentional erased blocks on the last part of the stem, not everywhere.
   let tail='';const end=lower[0],bb=4.9;
   for(let i=0;i<7;i++){
     tail+=`<rect x="${C(end.x+i*bb*.88)}" y="${C(end.y+i*bb*.8)}" width="${C(bb)}" height="${C(bb)}" fill="${i%3===0?p.rose:p.deep}" opacity="${C(.85-i*.085)}"/>`;
   }
   return `<g id="plant-drift"><g class="wood">${wood}</g><g class="blades">${leaves}</g><g class="blooms">${buds}</g>${tail}</g>`;
 }
 B.drawPlant=draw;
})(window.BotanicalPress);
