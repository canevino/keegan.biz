/* A printmaker's marks are authored vectors, not a global low-res filter. */
(function(B){
 'use strict';
 const F=B.f;
 const mark=(x,y,p,s=1)=>`<g transform="translate(${F(x)} ${F(y)}) scale(${s})" fill="none" stroke="${p.red}" stroke-linecap="square"><path d="M-17 0H17 M0 -17V17" stroke-width="2.6" opacity=".78"/><path d="M0 -24l4 17 18 7 -18 5 -4 18 -5 -18 -17 -5 17 -7Z" fill="${p.red}" opacity=".78" stroke="none"/></g>`;
 function grain(p,r,level){
   let dots='';
   for(let i=0;i<670;i++){
     const x=r.float(0,B.W),y=r.float(0,B.H),a=r.float(.03,.16)*(0.5+level*.65);
     const radius=r.float(.2,1.1);
     dots+=`<ellipse cx="${F(x)}" cy="${F(y)}" rx="${F(radius)}" ry="${F(radius*r.float(.7,1.8))}" fill="${r.chance(.4)?p.ochre:p.ink}" opacity="${F(a)}"/>`;
   }
   for(let i=0;i<36;i++){
     const x=r.float(0,B.W),y=r.float(0,B.H);
     dots+=`<path d="M${F(x)} ${F(y)}l${F(r.float(-1.8,1.8))} ${F(r.float(3,16))}" stroke="${p.ink}" stroke-width="${F(r.float(.3,.8))}" opacity="${F(r.float(.06,.16)*level)}"/>`;
   }
   return `<g aria-hidden="true">${dots}</g>`;
 }
 function burn(p,r,level){
   if(level<.25)return '';
   const opacity=F(.35+level*.45);
   let pits='';
   for(let i=0;i<100;i++){
     const x=r.float(-9,80),y=r.float(-10,140),fade=(1-Math.min(1,Math.hypot(x,y)/165));
     pits+=`<circle cx="${F(x)}" cy="${F(y)}" r="${F(r.float(.3,2.0))}" fill="${p.ochre}" opacity="${F(fade*r.float(.07,.35))}"/>`;
   }
   return `<g aria-hidden="true"><path d="M0 0H106 Q90 7 93 23L82 27 74 41 64 33 53 58 42 57 36 96 24 110 15 126 0 138Z" fill="url(#burn-vignette)" opacity="${opacity}"/><path d="M0 0H45 Q36 16 42 29 L33 46 24 41 16 68 11 76 0 91Z" fill="${p.ink}" opacity="${F(.36*level)}"/>${pits}</g>`;
 }
 function ring(p,r,shape,ornament){
   const k=(0.4+ornament*.6),cx=314,cy=356;
   let ring='';
   let arcs=[[-161,-40],[14,74],[101,174],[202,262]];
   if(shape==='gothic-pointed')arcs=[[-140,-30],[36,84],[112,165],[196,249]];
   if(shape==='roundel')arcs=[[-167,-35],[10,87],[112,180],[203,264]];
   if(shape==='celtic-double-spiral')arcs=[[-176,-51],[0,91],[125,181],[220,263]];
   for(let i=0;i<arcs.length;i++){
     const [a,b]=arcs[i],rr=174+(i%2)*2;
     const xy=t=>[cx+rr*Math.cos(t*Math.PI/180),cy+rr*Math.sin(t*Math.PI/180)];
     const [x,y]=xy(a),[x2,y2]=xy(b);
     ring+=`<path d="M${F(x)} ${F(y)} A${rr} ${rr} 0 0 1 ${F(x2)} ${F(y2)}" stroke="${p.rose}" stroke-width="${F(2*k)}" stroke-dasharray="40 5 3 7 21 3" fill="none" opacity=".67"/>`;
   }
   return `<g id="register-ring">${ring}</g>`;
 }
 function bar(x,y,width,p,r){
   const h=r.float(2.2,4.1),sections=r.int(5,10),unit=width/sections;
   let str='';
   for(let j=0;j<sections;j++){
     if(j>1&&r.chance(.28))continue;
     const shift=r.chance(.25)?h*2:0;
     str+=`<rect x="${F(x+j*unit)}" y="${F(y+shift)}" width="${F(unit+r.float(-1,.4))}" height="${F(h)}" fill="${r.chance(.10)?p.ink:p.rose}" opacity="${F(r.float(.3,.88))}"/>`;
   }
   return str;
 }
 function graphics(p,r,s){
   const ornament=B.clamp(Number(s.ornament)/100,0,1),glitch=B.clamp(Number(s.glitch)/100,0,1);
   let motifs=ring(p,r,s.geometry,ornament);
   motifs+=mark(85,269,p,.72)+mark(535,505,p,.85);
   if(ornament>.55)motifs+=`<path d="M94 338h16m-8 -8v16M503 194h18m-9 -9v18" stroke="${p.red}" opacity=".4" stroke-width="1.2"/>`;
   let artifacts='';
   const bars=[[137,241,100],[411,268,97],[143,542,79],[425,565,85],[292,430,50]];
   bars.forEach(([x,y,w],i)=>{if(i===0||i===1||r.chance(.40+.4*glitch))artifacts+=bar(x,y,w,p,r);});
   // Deliberate displacement rectangles: recognizable, screen-pixel geometry,
   // not a blanket resampling or compression artifact.
   const clusters=[[203,277,1],[420,374,-1],[238,468,1],[455,544,-1]];
   for(const [x,y,side] of clusters){
     if(!r.chance(glitch*.68))continue;
     const block=r.float(3,5.8);
     for(let j=0;j<4;j++){
       artifacts+=`<rect x="${F(x+side*j*block)}" y="${F(y+j*block)}" width="${F(block)}" height="${F(block)}" fill="${j%3?p.red:p.deep}" opacity="${F(r.float(.25,.62))}"/>`;
     }
   }
   return {motifs,artifacts};
 }
 B.paper=(p,r,distress)=>`<g id="paper-surface"><rect width="${B.W}" height="${B.H}" fill="${p.paper}"/>${grain(p,r,distress)}${burn(p,r,distress)}</g>`;
 B.graphics=graphics;
 B.defs=(p)=>`<defs>
   <radialGradient id="burn-vignette" cx="0" cy="0" r="1"><stop offset="0" stop-color="${p.ink}"/><stop offset=".32" stop-color="${p.ochre}" stop-opacity=".66"/><stop offset="1" stop-color="${p.paper}" stop-opacity="0"/></radialGradient>
   <filter id="edge-feather" x="-20%" y="-25%" width="140%" height="150%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="2.2"/></filter>
   <filter id="red-run" x="-27%" y="-30%" width="154%" height="160%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="3"/></filter>
 </defs>`;
 B.makeSVG=(s,options={})=>{
   const seed=(Number(s.seed)>>>0)||472818,p=B.palette(s.palette),r=B.rng(seed),dist=B.clamp(Number(s.distress)/100,0,1);
   const bg=B.paper(p,B.rng(seed^0x2fe67f),dist);
   const {motifs,artifacts}=B.graphics(p,B.rng(seed^0x135ae5),s);
   const plant=B.drawPlant(s,p,B.rng(seed^0xaf134));
   return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${B.W} ${B.H}" width="${B.W}" height="${B.H}" role="img" aria-label="Future-medieval botanical print, seed ${seed}">
    ${B.defs(p)}
    ${options.transparent?'':bg}
    <g id="ornamental-background">${motifs}</g>
    ${plant}
    <g id="print-glitches">${artifacts}</g>
   </svg>`;
 };
})(window.BotanicalPress);
