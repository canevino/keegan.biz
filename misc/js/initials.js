/* Insular-style initials: clipped interior pigment, small interlace and penwork. */
window.MS=window.MS||{};
((M)=>{
  'use strict';
  const txt=(letter,size)=>`<text x="0" y="0" font-family="Georgia, 'Palatino Linotype', 'Times New Roman', serif" font-weight="700" font-size="${M.n(size)}" text-anchor="middle">${M.escape(letter)}</text>`;
  const ellipse=(x,y,rx,ry,p,ink)=>`<ellipse cx="${M.n(x)}" cy="${M.n(y)}" rx="${M.n(rx)}" ry="${M.n(ry)}" fill="${p}" stroke="${ink}" stroke-width=".85"/>`;
  const scroll=(x,y,sign,size,pal,r)=>{
    let pts=[];for(let i=0;i<=32;i++){let t=i/32,rr=size*(1-.86*t),a=t*Math.PI*4.1*sign;pts.push({x:x+rr*Math.cos(a),y:y+rr*Math.sin(a)});}
    return M.path(pts.map((p,i)=>(i?'L':'M')+M.vec(p.x,p.y)).join(''),r.choose([pal.ink,pal.vermillion,pal.lapis]),r.between(1.2,2.7));
  };
  M.initial=(plan,s,r)=>{
    if(!s.initialVisible)return '';
    const {center,glyphSize:size}=plan,p=s.pal,letter=(s.initial||'B').slice(0,1).toUpperCase();
    const glyph=txt(letter,size),id='initial-clip';
    const ox=center.x, oy=center.y+size*.34;
    const pigment=r.choose([p.vermillion,p.lapis,p.green,M.mix(p.vermillion,p.ochre,.38)]);
    const loc=`translate(${M.vec(ox,oy)}) rotate(${M.n(r.between(-4,3))})`;
    let z=`<defs><clipPath id="${id}">${glyph}</clipPath></defs>`;
    // Outside letter: soft displaced impression, never a shiny gold gradient.
    z+=`<g transform="${loc}">`;
    z+=`<g filter="url(#press)"><text x="0" y="0" font-family="Georgia, 'Palatino Linotype', serif" font-weight="700" font-size="${M.n(size)}" text-anchor="middle" fill="${pigment}" stroke="${p.ink}" stroke-width="${M.n(size*.018)}" paint-order="stroke fill">${M.escape(letter)}</text></g>`;
    const clipContent=[];
    // Closely spaced light hatching makes the initial feel carved/printed, not bevelled.
    const n=Math.round(12+s.pigment*.26);
    for(let i=0;i<n;i++){
      const y=-size*.91+(i+1)*size*1.04/n,xx=r.between(-size*.43,-size*.26);
      clipContent.push(M.path(`M${M.vec(xx,y)}l${M.vec(r.between(size*.42,size*.9),-size*r.between(.015,.065))}`,M.mix(p.light,p.ochre,.22),r.between(.52,1.35),`opacity="${M.n(r.between(.2,.65))}"`));
    }
    // The interlace engine is a true break/crossing grid, clipped to the letter's strokes.
    if(s.knots>12){
      const cfg={density:.18+s.knots/165,distort:s.wear/150,misprint:s.wear/220};
      clipContent.push(M.knot?M.knot(0,-size*.36,size/525,r.between(-8,8),cfg,[p.ink,p.ochre,p.lapis,p.green,p.vermillion],r):'');
    }
    // Small motifs occupy the actual glyph interior, not random locations on the page.
    for(let i=0;i<12+s.detail;i++){
      const x=r.between(-size*.31,size*.31),y=r.between(-size*.78,-size*.01),rr=r.between(1.6,4.5);
      clipContent.push(ellipse(x,y,rr,rr*.75,r.choose([p.ochre,p.green,p.light]),p.ink));
    }
    z+=`<g clip-path="url(#${id})" opacity=".75">${clipContent.join('')}<rect x="-${M.n(size*.5)}" y="-${M.n(size)}" width="${M.n(size)}" height="${M.n(size*1.2)}" fill="url(#speckle)" opacity=".45"/></g>`;
    // Penwork extends from terminals but is kept light and local.
    z+=scroll(size*r.between(.14,.26),-size*r.between(.76,.9),1,size*r.between(.09,.15),p,r);
    z+=scroll(-size*r.between(.12,.23),-size*r.between(.15,.27),-1,size*r.between(.09,.14),p,r);
    z+='</g>';
    return z;
  };
})(window.MS);
