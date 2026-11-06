/* Print surface and ornamental corruption for the future-medieval botanical press. */
(function(B){
 'use strict';
 const F=B.f;
 const clamp=B.clamp;
 const mark=(x,y,p,s=1)=>`<g transform="translate(${F(x)} ${F(y)}) scale(${s})" fill="none" stroke="${p.red}" stroke-linecap="square"><path d="M-17 0H17 M0 -17V17" stroke-width="2.6" opacity=".78"/><path d="M0 -24l4 17 18 7 -18 5 -4 18 -5 -18 -17 -5 17 -7Z" fill="${p.red}" opacity=".78" stroke="none"/></g>`;
 function grain(p,r,level){
   let dots='';
   for(let i=0;i<680;i++){
     const x=r.float(0,B.W),y=r.float(0,B.H),a=r.float(.03,.16)*(0.46+level*.72);
     const radius=r.float(.2,1.1);
     dots+=`<ellipse cx="${F(x)}" cy="${F(y)}" rx="${F(radius)}" ry="${F(radius*r.float(.7,1.8))}" fill="${r.chance(.4)?p.ochre:p.ink}" opacity="${F(a)}"/>`;
   }
   for(let i=0;i<44;i++){
     const x=r.float(0,B.W),y=r.float(0,B.H),len=r.float(4,18);
     dots+=`<path d="M${F(x)} ${F(y)}l${F(r.float(-1.8,1.8))} ${F(len)}" stroke="${p.ink}" stroke-width="${F(r.float(.3,.8))}" opacity="${F(r.float(.06,.16)*level)}"/>`;
   }
   return `<g aria-hidden="true">${dots}</g>`;
 }
 function burn(p,r,level){
   if(level<.18)return '';
   let blobs='';
   const corners=[[0,0],[B.W,0],[0,B.H],[B.W,B.H]];
   const count=1+Math.round(level*3.5);
   for(let i=0;i<count;i++){
     const [cx,cy]=r.pick(corners);
     const rx=r.float(65,168),ry=r.float(40,132),rot=r.float(-45,45);
     blobs += `<ellipse cx="${F(cx+r.float(-16,16))}" cy="${F(cy+r.float(-16,16))}" rx="${F(rx)}" ry="${F(ry)}" fill="url(#burn-vignette)" opacity="${F(r.float(.18,.38)+level*.18)}" transform="rotate(${F(rot)} ${F(cx)} ${F(cy)})"/>`;
   }
   for(let i=0;i<90;i++){
     const x=r.float(0,90),y=r.float(0,120),fade=(1-Math.min(1,Math.hypot(x,y)/165));
     blobs+=`<circle cx="${F(x)}" cy="${F(y)}" r="${F(r.float(.3,2.0))}" fill="${p.ochre}" opacity="${F(fade*r.float(.07,.35))}"/>`;
   }
   return `<g aria-hidden="true">${blobs}</g>`;
 }
 function smudges(p,r,level){
   let d='';
   const count=Math.round(2+level*8);
   for(let i=0;i<count;i++){
     const x=r.float(90,540),y=r.float(110,620),w=r.float(22,95),h=r.float(6,28),rot=r.float(-40,40);
     d += `<ellipse cx="${F(x)}" cy="${F(y)}" rx="${F(w)}" ry="${F(h)}" fill="${r.chance(.65)?p.ash:p.rose}" opacity="${F(r.float(.03,.12)+level*.06)}" filter="url(#smear)" transform="rotate(${F(rot)} ${F(x)} ${F(y)})"/>`;
   }
   return `<g aria-hidden="true">${d}</g>`;
 }
 function ring(p,r,shape,ornament){
   const k=(0.4+ornament*.6),cx=314,cy=356;
   let ring='';
   let arcs=[[-161,-40],[14,74],[101,174],[202,262]];
   if(shape==='gothic-pointed')arcs=[[-140,-30],[36,84],[112,165],[196,249]];
   if(shape==='gothic-quatrefoil')arcs=[[-180,-122],[-63,-10],[7,60],[122,178],[205,260]];
   if(shape==='roundel')arcs=[[-167,-35],[10,87],[112,180],[203,264]];
   if(shape==='celtic-double-spiral')arcs=[[-176,-51],[0,91],[125,181],[220,263]];
   if(shape==='celtic-scroll')arcs=[[-160,-103],[-8,36],[78,118],[176,241]];
   for(let i=0;i<arcs.length;i++){
     const [a,b]=arcs[i],rr=168+(i%2)*8+r.float(-3,3);
     const xy=t=>[cx+rr*Math.cos(t*Math.PI/180),cy+rr*Math.sin(t*Math.PI/180)];
     const [x,y]=xy(a),[x2,y2]=xy(b);
     ring+=`<path d="M${F(x)} ${F(y)} A${F(rr)} ${F(rr)} 0 0 1 ${F(x2)} ${F(y2)}" stroke="${i%2?p.rose:p.red}" stroke-width="${F(1.2+2*k)}" stroke-dasharray="40 5 3 7 21 3" fill="none" opacity=".46"/>`;
   }
   return `<g id="register-ring">${ring}</g>`;
 }
 function heraldicFrame(p,r,ornament){
   if(ornament<.34) return '';
   let frame='';
   if(ornament>.56){
     frame += `<path d="M74 72h472M74 638h472" stroke="${p.red}" stroke-width="1.2" opacity=".15"/>`;
   }
   if(ornament>.7){
     frame += mark(102,113,p,.54)+mark(530,113,p,.54)+mark(102,594,p,.54)+mark(530,594,p,.54);
   }
   if(ornament>.82){
     frame += `<path d="M110 109 q24 -18 48 0 q-24 18 -48 0Zm362 0 q24 -18 48 0 q-24 18 -48 0Z" fill="${p.red}" opacity=".18"/>`;
   }
   return `<g class="frame-layer">${frame}</g>`;
 }
 function bar(x,y,width,p,r){
   const h=r.float(2.2,4.1),sections=r.int(5,10),unit=width/sections;
   let str='';
   for(let j=0;j<sections;j++){
     if(j>1&&r.chance(.28))continue;
     const shift=r.chance(.25)?h*2:0;
     str+=`<rect x="${F(x+j*unit)}" y="${F(y+shift)}" width="${F(unit+r.float(-1,.4))}" height="${F(h)}" fill="${r.chance(.12)?p.ink:p.rose}" opacity="${F(r.float(.3,.88))}"/>`;
   }
   return str;
 }
 function glyphStrip(p,r,glitch){
   if(glitch<.2) return '';
   let g='';
   const count=2+Math.round(glitch*4);
   for(let i=0;i<count;i++){
     const x=r.float(100,510),y=r.float(120,590),s=r.float(.7,1.35),rot=r.float(-20,20);
     const bits=r.pick([
       'M0 -14L11 0L0 14L-11 0Z',
       'M-12 -12H12V-6H-3V12H-12Z',
       'M-13 0H13 M0 -13V13',
       'M-10 -10L10 10 M10 -10L-10 10'
     ]);
     g += `<g transform="translate(${F(x)} ${F(y)}) rotate(${F(rot)}) scale(${F(s)})"><path d="${bits}" fill="none" stroke="${r.chance(.5)?p.red:p.rose}" stroke-width="1.4" opacity="${F(.16+glitch*.28)}"/></g>`;
   }
   return `<g class="glyph-layer">${g}</g>`;
 }
 function graphics(p,r,s){
   const ornament=clamp(Number(s.ornament)/100,0,1),glitch=clamp(Number(s.glitch)/100,0,1),distress=clamp(Number(s.distress)/100,0,1);
   const shape=s._resolvedGeometry || s.geometry;
   let motifs=ring(p,r,shape,ornament)+heraldicFrame(p,r,ornament)+glyphStrip(p,r,glitch);
   motifs+=mark(85,269,p,.72)+mark(535,505,p,.85);
   let artifacts='';
   const bars=[[137,241,100],[411,268,97],[143,542,79],[425,565,85],[292,430,50],[185,318,74],[332,182,64]];
   bars.forEach(([x,y,w],i)=>{if(i<2||r.chance(.18+.58*glitch))artifacts+=bar(x,y,w,p,r);});
   const clusters=[[203,277,1],[420,374,-1],[238,468,1],[455,544,-1],[288,171,1],[166,514,-1]];
   for(const [x,y,side] of clusters){
     if(!r.chance(.18+glitch*.72))continue;
     const block=r.float(3,7.2),len=r.int(3,6);
     for(let j=0;j<len;j++){
       artifacts+=`<rect x="${F(x+side*j*block)}" y="${F(y+j*block)}" width="${F(block)}" height="${F(block)}" fill="${j%3?p.red:(j%2?p.deep:p.green)}" opacity="${F(r.float(.18,.62))}"/>`;
     }
   }
   if(glitch>.55){
     for(let i=0;i<4+r.int(0,4);i++){
       const x=r.float(110,500),y=r.float(120,590),w=r.float(12,44),h=r.float(1.2,3.6);
       artifacts += `<rect x="${F(x)}" y="${F(y)}" width="${F(w)}" height="${F(h)}" fill="${p.red}" opacity="${F(r.float(.12,.28))}" transform="skewX(${F(r.float(-35,35))})"/>`;
     }
   }
   const atmosphere=smudges(p,r,distress);
   return {motifs,artifacts,atmosphere};
 }
 B.paper=(p,r,distress)=>`<g id="paper-surface"><rect width="${B.W}" height="${B.H}" fill="${p.paper}"/>${grain(p,r,distress)}${burn(p,r,distress)}</g>`;
 B.graphics=graphics;
 B.defs=(p)=>`<defs>
   <radialGradient id="burn-vignette" cx="0" cy="0" r="1"><stop offset="0" stop-color="${p.ink}"/><stop offset=".32" stop-color="${p.ochre}" stop-opacity=".66"/><stop offset="1" stop-color="${p.paper}" stop-opacity="0"/></radialGradient>
   <filter id="edge-feather" x="-20%" y="-25%" width="140%" height="150%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="2.2"/></filter>
   <filter id="red-run" x="-27%" y="-30%" width="154%" height="160%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="3"/></filter>
   <filter id="smear" x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur stdDeviation="4"/></filter>
 </defs>`;
 B.makeSVG=(s,options={})=>{
   const seed=(Number(s.seed)>>>0)||472818,p=B.palette(s.palette),r=B.rng(seed),dist=B.clamp(Number(s.distress)/100,0,1);
   const bg=B.paper(p,B.rng(seed^0x2fe67f),dist);
   // Copy so resolved style info can be attached and shared with graphics.
   const state={...s};
   const plant=B.drawPlant(state,p,B.rng(seed^0xaf134));
   const {motifs,artifacts,atmosphere}=B.graphics(p,B.rng(seed^0x135ae5),state);
   return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${B.W} ${B.H}" width="${B.W}" height="${B.H}" role="img" aria-label="Future-medieval botanical print, seed ${seed}">
    ${B.defs(p)}
    ${options.transparent?'':bg}
    <g id="ornamental-background">${motifs}</g>
    ${plant}
    <g id="print-atmosphere">${atmosphere}</g>
    <g id="print-glitches">${artifacts}</g>
   </svg>`;
 };
})(window.BotanicalPress);
