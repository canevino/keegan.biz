/* Pass 2: custom constructed Insular-inspired initials, not font text.
   Every capital is built from expanded curved hand-coded pen strokes in glyphs.js.
   Woven interlace, mineral pigment and engraved hatching are all clipped to
   the actual stroke silhouettes, not a rectangular badge. */
window.MS=window.MS||{};
((M)=>{
  'use strict';
  const N=M.n;
  const scroll=(x,y,side,size,pal,r)=>{
    const pts=[];
    for(let i=0;i<=30;i++){
      const t=i/30,a=t*Math.PI*(r.between(2.6,3.8))*side+side*.3;
      const rr=size*(1-t*.90);
      pts.push({x:x+Math.cos(a)*rr,y:y+Math.sin(a)*rr});
    }
    return M.path(pts.map((p,i)=>(i?'L':'M')+M.vec(p.x,p.y)).join(''),r.choose([pal.ink,pal.vermillion,pal.green]),r.between(.7,1.25));
  };
  M.initial=(plan,s,r)=>{
    if(!s.initialVisible)return '';
    if(!M.glyph)throw new Error('Missing glyphs.js custom letter construction module');
    const p=s.pal;
    const glyph=M.glyph(s.initial,plan.glyphSize,r);
    const id='insular-letter-mask';
    const ox=plan.center.x,oy=plan.center.y+plan.glyphSize*.41;
    const base=r.choose([M.mix(p.green,p.ink,.22),M.mix(p.vermillion,p.ochre,.22),M.mix(p.lapis,p.ink,.2)]);
    const strokes=glyph.paths;
    const clip=strokes.map(d=>`<path d="${d}"/>`).join('');
    let z=`<g id="drawn-initial" transform="translate(${M.vec(ox,oy)}) rotate(${N(r.between(-2,2))})">`;
    z+=`<g transform="${glyph.transform}">`;
    z+=`<defs><clipPath id="${id}" clipPathUnits="userSpaceOnUse">${clip}</clipPath></defs>`;
    // Fills are separate vector polygons, no dependence on client fonts.
    z+=`<g filter="url(#press)">`;
    strokes.forEach((d,i)=>{
      const color=i===0?base:M.mix(base,i%2?p.ochre:p.lapis,r.between(.06,.20));
      z+=M.shape(d,color,`stroke="${p.ink}" stroke-width="${N(r.between(1.1,1.75))}" stroke-linejoin="round"`);
    });
    z+='</g>';
    z+=`<g clip-path="url(#${id})">`;
    // Woven bands follow the letter footprint and are cut by every counter.
    if(s.knots>9&&M.knot){
      const scale=.28+s.knots*.0022;
      z+=`<g opacity="${N(.43+s.knots*.0038)}">${M.knot(0,-72,scale,r.between(-8,8),{density:.38+s.knots*.004,distort:s.distortion/260,misprint:.025},[p.ink,p.ochre,p.lapis,p.green,p.vermillion],r)}</g>`;
    }
    // Irregular interior hatching follows a swept direction, never an SVG font gradient.
    for(let i=0;i<19+Math.floor(s.detail*.24);i++){
      const y=-142+i*r.between(3.6,5.6),x=r.between(-55,-33),x2=r.between(21,55);
      z+=M.path(`M${M.vec(x,y)} Q${M.vec(r.between(-5,10),y+r.between(-9,-1))} ${M.vec(x2,y-r.between(0,11))}`,M.mix(p.light,p.ochre,.3),r.between(.38,1.12),`opacity="${N(r.between(.15,.42))}"`);
    }
    for(let i=0;i<Math.round(8+s.detail*.18);i++){
      const x=r.between(-52,54),y=r.between(-136,-5),d=r.between(1,3.6);
      z+=M.circle(x,y,d,r.choose([p.ochre,p.light,p.green,p.vermillion]),`stroke="${p.ink}" stroke-width=".4" opacity="${N(r.between(.35,.85))}"`);
    }
    if(s.pigment>9)z+=`<rect x="-75" y="-160" width="150" height="185" fill="url(#speckle)" opacity="${N(.20+s.pigment*.004)}"/>`;
    z+='</g>';
    // Finials attach to the drawn letter's actual stroke endpoints.
    // Tiny roundels and pointed trumpet leaves echo Insular penwork.
    const ends=r.shuffled(glyph.terminals).slice(0,plan.glyphSize<230?2:4);
    ends.forEach((port,i)=>{
      const len=r.between(7,17),a=port.angle;
      const tip={x:port.x+Math.cos(a)*len,y:port.y+Math.sin(a)*len};
      z+=M.path(`M${M.vec(port.x,port.y)}Q${M.vec(port.x+Math.cos(a+.4)*len*.6,port.y+Math.sin(a+.4)*len*.6)} ${M.vec(tip.x,tip.y)}`,
        r.choose([p.ink,p.ochre,p.vermillion]),r.between(.8,1.3));
      if(i%2===0){
        z+=scroll(tip.x,tip.y,i%3?-1:1,r.between(4.5,9),p,r);
      }else{
        const rx=tip.x+Math.cos(a)*8,ry=tip.y+Math.sin(a)*8;
        z+=M.circle(rx,ry,r.between(2.5,4.8),p.ochre,`stroke="${p.ink}" stroke-width=".65"`);
        z+=M.circle(rx,ry,r.between(.65,1.5),p.vermillion);
      }
    });
    z+='</g></g>';
    return z;
  };
})(window.MS);
