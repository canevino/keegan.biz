/* Ornament compositor: manuscript letters, bodyful vines, knotwork and broken print. */
window.Ornament = window.Ornament || {};
((O)=>{
  'use strict';
  const {f,path,fill,rect,circle,blob,esc} = O;
  const V = (x,y) => `${f(x)} ${f(y)}`;
  const G = (tr,body,extra='') => `<g transform="${tr}" ${extra}>${body}</g>`;
  const dark = s => s.pal[0], red = s => s.pal[1], blue = s => s.pal[2], green = s => s.pal[3], gold = s => s.pal[4], paper = s => s.pal[5];

  function pigmentInk(a,b,t){ return O.pigment(a,b,t); }
  function medPath(x1,y1,cx,cy,x2,y2){ return `M${V(x1,y1)} Q${V(cx,cy)} ${V(x2,y2)}`; }
  function branchPath(x,y,len,ang,bend){
    const x2 = x + Math.cos(ang)*len;
    const y2 = y + Math.sin(ang)*len;
    const cx = x + Math.cos(ang + bend) * len * .48;
    const cy = y + Math.sin(ang + bend) * len * .48;
    return {d: medPath(x,y,cx,cy,x2,y2), x2, y2, cx, cy};
  }
  function lineDecor(x,y,w,h,r,s,count=12){
    let z='';
    for(let i=0;i<count;i++){
      const xx=x+r.n(0,w), yy=y+r.n(0,h);
      if(r.chance(.6)) z += path(`M${V(xx,yy)}l${f(r.n(-8,8))} ${f(r.n(-3,14))}`, r.pick([dark(s), red(s), blue(s), gold(s)]), r.n(.28,.95), `opacity="${f(r.n(.14,.48))}"`);
      else z += rect(xx,yy,r.n(1.2,7.4),r.n(1.2,7.4), r.pick([red(s),blue(s),green(s),gold(s),dark(s)]), `opacity="${f(r.n(.12,.34))}"`);
    }
    return z;
  }
  function leaf(x,y,len,ang,s,r,fillCol){
    const wid = len * r.n(.28,.44);
    const curl = len * r.n(.12,.24) * r.sign();
    const tipX = Math.cos(ang) * len;
    const tipY = Math.sin(ang) * len;
    const leftX = Math.cos(ang - Math.PI/2) * wid;
    const leftY = Math.sin(ang - Math.PI/2) * wid;
    const rightX = Math.cos(ang + Math.PI/2) * wid;
    const rightY = Math.sin(ang + Math.PI/2) * wid;
    const d = `M0 0 C${f(leftX*.55)} ${f(leftY*.55)} ${f(leftX+curl*.18)} ${f(leftY+tipY*.38)} ${f(tipX)} ${f(tipY)} C${f(rightX+curl*.12)} ${f(rightY+tipY*.4)} ${f(rightX*.58)} ${f(rightY*.58)} 0 0 Z`;
    const vein = `M0 0 Q${f(tipX*.46+curl*.1)} ${f(tipY*.48)} ${f(tipX)} ${f(tipY)}`;
    const col = fillCol || r.pick([green(s), pigmentInk(green(s),gold(s),.18), red(s), blue(s)]);
    return G(`translate(${V(x,y)}) rotate(${f(ang*180/Math.PI)})`,
      fill(d,col,`stroke="${dark(s)}" stroke-width=".72"`) +
      path(vein, pigmentInk(dark(s), paper(s), .25), .55, `opacity=".76"`)
    );
  }
  function flower(x,y,size,s,r){
    let z='';
    const n = r.pick([4,5,6]);
    const cols = [red(s), blue(s), gold(s), green(s)];
    for(let i=0;i<n;i++){
      const a = (Math.PI*2*i/n) + r.n(-.1,.1);
      const cx = Math.cos(a) * size * .34;
      const cy = Math.sin(a) * size * .34;
      z += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(size*.22)}" ry="${f(size*.54)}" transform="rotate(${f(a*180/Math.PI)} ${f(cx)} ${f(cy)})" fill="${cols[i%cols.length]}" stroke="${dark(s)}" stroke-width=".7"/>`;
    }
    z += circle(0,0,size*.16,gold(s),`stroke="${dark(s)}" stroke-width=".8"`);
    return G(`translate(${V(x,y)}) rotate(${f(r.n(-20,20))})`,z);
  }
  function spiral(x,y,rad,s,r,col){
    let turns=r.n(1.4,2.6),steps=40,pts=[];
    for(let i=0;i<=steps;i++){
      let t=i/steps, a=t*turns*2*Math.PI + r.n(-.01,.01), rr=rad*(.08+.9*t);
      pts.push([x+Math.cos(a)*rr,y+Math.sin(a)*rr]);
    }
    return path('M'+V(...pts[0])+pts.slice(1).map(p=>'L'+V(...p)).join(''), col || dark(s), r.n(.8,1.65), 'stroke-linecap="round"');
  }
  function stemStroke(d,s,w,inner){
    const bark = inner || pigmentInk(dark(s), green(s), .24);
    return path(d, dark(s), w*1.26, `opacity=".96"`) +
      path(d, bark, w*.78, `opacity=".95"`) +
      path(d, pigmentInk(bark,paper(s),.38), Math.max(.65,w*.12), `opacity=".34"`);
  }
  function vine(x,y,length,ang,s,r,opts={}){
    const density = s.foliage / 100;
    const weight = opts.weight || 1;
    const bendA = ang + r.n(-.36,.36);
    const bendB = ang + r.n(-.48,.48);
    const x1 = Math.cos(bendA) * length * .22;
    const y1 = Math.sin(bendA) * length * .22;
    const x2 = Math.cos(bendB) * length * .72;
    const y2 = Math.sin(bendB) * length * .72;
    const x3 = Math.cos(ang) * length;
    const y3 = Math.sin(ang) * length;
    const d = `M0 0 C${V(x1,y1)} ${V(x2,y2)} ${V(x3,y3)}`;
    let z = stemStroke(d,s,4.6*weight, pigmentInk(dark(s), r.pick([green(s), red(s), blue(s)]), .12));
    const nodes = Math.max(4,Math.round(6 + 16*density));
    for(let i=1;i<nodes;i++){
      const t = i / nodes;
      const px = (1-t)*(1-t)*(1-t)*0 + 3*(1-t)*(1-t)*t*x1 + 3*(1-t)*t*t*x2 + t*t*t*x3;
      const py = (1-t)*(1-t)*(1-t)*0 + 3*(1-t)*(1-t)*t*y1 + 3*(1-t)*t*t*y2 + t*t*t*y3;
      const nx = 3*(1-t)*(1-t)*(x1-0) + 6*(1-t)*t*(x2-x1) + 3*t*t*(x3-x2);
      const ny = 3*(1-t)*(1-t)*(y1-0) + 6*(1-t)*t*(y2-y1) + 3*t*t*(y3-y2);
      const tangent = Math.atan2(ny,nx);
      const side = (i % 2 ? 1 : -1) * (opts.side || 1);
      const leafAng = tangent + side * r.n(.55,1.3);
      const leafLen = r.n(18,54) * (.6 + density*.8) * weight;
      const branchLen = leafLen * r.n(.3,.65);
      const {d:bd, x2:bx, y2:by} = branchPath(px,py,branchLen,leafAng,r.n(-.18,.18));
      z += stemStroke(bd,s,1.4*weight, pigmentInk(dark(s), green(s), .2));
      if(r.chance(.9)) z += leaf(bx,by,leafLen,leafAng,s,r);
      if(r.chance(.44 + density*.2)) z += leaf(px + Math.cos(leafAng)*branchLen*.45, py + Math.sin(leafAng)*branchLen*.45, leafLen*.62, leafAng + side*r.n(.18,.4), s, r);
      if(r.chance(.34 + density*.12)) z += spiral(px + Math.cos(leafAng)*branchLen*.15, py + Math.sin(leafAng)*branchLen*.15, r.n(7,16)*weight, s, r, pigmentInk(dark(s), red(s), .28));
      if(r.chance(.12 + density*.18)) z += flower(bx + Math.cos(leafAng)*r.n(4,10), by + Math.sin(leafAng)*r.n(4,10), r.n(7,13)*weight, s, r);
    }
    return G(`translate(${V(x,y)})`, z, `filter="url(#ink)"`);
  }
  function vineArc(x1,y1,x2,y2,s,r,weight=1){
    const len = Math.hypot(x2-x1,y2-y1);
    const ang = Math.atan2(y2-y1,x2-x1);
    return vine(x1,y1,len,ang,s,r,{weight});
  }
  function pigmentField(x,y,w,h,s,r,shape='blob'){
    if(s.pigment < 4) return '';
    const clip = shape==='panel'
      ? `M${V(x-w/2,y-h/2)}L${V(x+w/2,y-h/2)}L${V(x+w/2,y+h/2)}L${V(x-w/2,y+h/2)}Z`
      : blob(x,y,w*.52,h*.52,r,18);
    const id = `p-${Math.round(x)}-${Math.round(y)}-${Math.round(w)}`;
    let z = `<clipPath id="${id}"><path d="${clip}"/></clipPath>`;
    const cols = r.int(10,18), rows = r.int(10,20), cw = w/cols, ch = h/rows;
    z += `<g clip-path="url(#${id})" opacity="${f(.22+.42*s.pigment/100)}">`;
    for(let j=0;j<rows;j++) for(let i=0;i<cols;i++) if(r.chance(.3+.44*s.pigment/100)){
      const col = r.pick([red(s),blue(s),green(s),gold(s),pigmentInk(red(s),blue(s),.5),dark(s)]);
      const xx = x-w/2+i*cw + r.n(-1.8,1.8);
      const yy = y-h/2+j*ch + r.n(-1.8,1.8);
      z += rect(xx,yy,cw*r.n(.55,1.2),ch*r.n(.55,1.2),col,`opacity="${f(r.n(.36,.94))}"`);
    }
    z += `</g>`;
    if(s.wear > 20){
      z += `<g clip-path="url(#${id})" opacity="${f(.12+.18*s.wear/100)}" filter="url(#rough)">`;
      for(let i=0;i<18+Math.floor(s.wear*.5);i++){
        const xx = x+r.n(-w*.46,w*.46), yy = y+r.n(-h*.46,h*.46);
        z += rect(xx,yy,r.n(6,22),r.n(4,18),r.pick([paper(s),paper(s),gold(s),red(s)]),`opacity="${f(r.n(.2,.48))}"`);
      }
      z += `</g>`;
    }
    z += lineDecor(x-w/2,y-h/2,w,h,r,s,18+Math.floor(s.pigment/5));
    return z;
  }
  function initial(x,y,size,s,r,ch){
    const e = esc((ch||'A').toUpperCase().slice(0,1));
    const tone = r.pick([
      pigmentInk(gold(s),paper(s),.2),
      pigmentInk(paper(s),gold(s),.34),
      pigmentInk(pigmentInk(gold(s),paper(s),.5), dark(s), .08)
    ]);
    const letterId = `init-${Math.round(x)}-${Math.round(y)}-${Math.round(size)}`;
    const strokeW = size * .017;
    let base = `<defs><clipPath id="${letterId}"><text x="0" y="0" text-anchor="middle" font-family="Georgia,Times New Roman,serif" font-weight="700" font-size="${f(size)}">${e}</text></clipPath></defs>`;
    let shadow = `<text x="${f(size*.012)}" y="${f(size*.012)}" text-anchor="middle" font-family="Georgia,Times New Roman,serif" font-weight="700" font-size="${f(size)}" fill="${pigmentInk(red(s),dark(s),.55)}" opacity=".16">${e}</text>`;
    let body = `<text x="0" y="0" text-anchor="middle" font-family="Georgia,Times New Roman,serif" font-weight="700" font-size="${f(size)}" fill="${tone}" stroke="${dark(s)}" stroke-width="${f(strokeW)}" paint-order="stroke fill">${e}</text>`;
    let grain = `<g clip-path="url(#${letterId})" opacity=".72">`;
    for(let i=0;i<26+Math.floor(s.wear*.45);i++){
      const xx = r.n(-size*.32,size*.28), yy = r.n(-size*.82,size*.04);
      grain += rect(xx,yy,r.n(2,16),r.n(1.3,7),r.pick([paper(s),gold(s),red(s),blue(s),green(s)]),`opacity="${f(r.n(.1,.26))}"`);
      if(r.chance(.46)) grain += path(`M${V(xx,yy)}l${f(r.n(-9,9))} ${f(r.n(-1,11))}`, r.pick([dark(s),red(s),gold(s)]), r.n(.35,1.1), `opacity="${f(r.n(.14,.42))}"`);
    }
    grain += `</g>`;
    let flourishes='';
    const n = 4 + Math.floor(s.foliage/23);
    for(let i=0;i<n;i++){
      const t = i/Math.max(1,n-1);
      const ax = (i%2?-1:1) * size * r.n(.12,.22);
      const ay = -size*(.08+t*.72);
      flourishes += spiral(ax,ay,size*r.n(.028,.07),s,r,i%2?green(s):red(s));
      if(r.chance(.76)) flourishes += leaf(ax+r.n(-5,5), ay+r.n(-4,4), size*r.n(.05,.1), r.n(-2.3,2.3), s, r, r.pick([green(s), red(s), blue(s)]));
    }
    return G(`translate(${V(x,y)}) rotate(${f(r.n(-5,5))})`, base + G('',shadow+body+grain,`filter="url(#ink)"`) + flourishes);
  }
  function medallion(x,y,radius,s,r){
    let out='';
    out += circle(x,y,radius,'none',`stroke="${dark(s)}" stroke-width="2"`);
    out += circle(x,y,radius-5,'none',`stroke="${gold(s)}" stroke-width="3.2" opacity=".9"`);
    for(let i=0;i<8;i++){
      const a = i*Math.PI/4;
      out += leaf(x+Math.cos(a)*radius*.82,y+Math.sin(a)*radius*.82,radius*.28,a+Math.PI/2,s,r,r.pick([red(s),green(s),blue(s),gold(s)]));
    }
    out += spiral(x,y,radius*.48,s,r,red(s));
    out += circle(x,y,radius*.14,gold(s),`stroke="${dark(s)}" stroke-width="1.1"`);
    return out;
  }
  function knots(x,y,scale,rotation,s,r,big=false){
    if(s.knots<=0) return '';
    const settings = { density:.24+s.knots/155, distort:s.wear/180, misprint:s.wear/250 };
    return O.knot(x,y,scale,rotation,settings,[dark(s),blue(s),red(s),gold(s),green(s)],r,{big});
  }
  function manuscriptText(x,y,s,r,rows){
    if(s.letters===0) return '';
    const words = ['folia','umbra','lignum','ordo','fervor','lumen','mora','silva','alba','noctis','verum','flora','in situ','memento','fragment','pigmenta','✣','†','ix'];
    let out = '';
    const n = Math.max(1,Math.floor(rows*s.letters/100));
    for(let i=0;i<n;i++){
      const xx=x+r.n(-28,28), yy=y+i*r.n(18,30), str=r.pick(words), rot=r.n(-7,7)*Math.max(.3,s.wear/80), size=r.n(14,29);
      const col=r.pick([dark(s),dark(s),red(s), pigmentInk(dark(s),blue(s),.18)]);
      out += G(`translate(${V(xx,yy)}) rotate(${f(rot)})`, `<text x="0" y="0" font-family="Georgia,Times New Roman,serif" font-size="${f(size)}" font-style="${r.chance(.28)?'italic':'normal'}" font-weight="${r.chance(.3)?700:400}" fill="${col}" letter-spacing="-${f(r.n(.15,.8))}">${esc(str)}</text>`, `filter="url(#dry)" opacity="${f(r.n(.45,.96))}"`);
    }
    return out;
  }
  function fragmentGlyphs(x,y,w,h,s,r){
    if(s.letters < 8) return '';
    let z='';
    const chars = ['a','b','d','m','n','r','x','v','✣'];
    const bigCount = 2 + Math.round(s.letters/45);
    for(let i=0;i<bigCount;i++){
      const ch = r.pick(chars);
      const xx = x+r.n(-w*.45,w*.45), yy=y+r.n(-h*.45,h*.45), size=r.n(90,260), rot=r.n(-35,35);
      const col = r.pick([paper(s), dark(s), red(s), green(s)]);
      z += G(`translate(${V(xx,yy)}) rotate(${f(rot)})`, `<text x="0" y="0" font-family="Georgia,Times New Roman,serif" font-size="${f(size)}" font-weight="700" fill="${col}">${esc(ch)}</text>`, `opacity="${f(r.n(.08,.22))}" filter="url(#ink)"`);
    }
    for(let i=0;i<10+Math.round(s.letters*.3);i++){
      const str = r.pick(['ink','ord','xiv','mm','li','ruin','leaf']);
      const xx = x+r.n(-w*.48,w*.48), yy=y+r.n(-h*.48,h*.48), rot=r.n(-40,40), size=r.n(16,58);
      z += G(`translate(${V(xx,yy)}) rotate(${f(rot)})`, `<text x="0" y="0" font-family="Georgia,Times New Roman,serif" font-size="${f(size)}" font-style="${r.chance(.45)?'italic':'normal'}" fill="${r.pick([dark(s),red(s),blue(s),green(s)])}">${esc(str)}</text>`, `opacity="${f(r.n(.12,.48))}" filter="url(#dry)"`);
    }
    return z;
  }
  function structuralRules(s,r){
    let z='';
    if(s.letters > 20){
      const y1 = r.n(360,640), y2 = y1+r.n(18,52), x1=r.n(180,240), x2=r.n(640,760);
      z += path(`M${V(x1,y1)}L${V(x2,y1)}`,dark(s),r.n(4,7),`opacity=".82"`);
      z += path(`M${V(x1,y2)}L${V(x2,y2)}`,gold(s),r.n(1.2,2.6),`opacity=".84"`);
    }
    return z;
  }
  function composition(mode,s,r){
    let art='';
    const fol = s.foliage/100;
    if(mode === 'marginalia'){
      art += pigmentField(240,390,240,380,s,r) + pigmentField(610,735,270,310,s,r);
      if(fol){
        art += vine(120,975,780,-1.46,s,r,{weight:1.3});
        art += vine(734,980,806,-1.67,s,r,{weight:1.36, side:-1});
        if(fol>.28) art += vineArc(172,220,694,226,s,r,.78);
        if(fol>.42) art += vineArc(188,922,690,905,s,r,.92);
      }
      if(s.showInitial) art += initial(r.n(335,470),r.n(560,650),r.n(290,390),s,r,s.initial);
      if(s.knots>12) art += knots(r.n(530,640),r.n(250,336),r.n(.46,.65),r.n(-15,15),s,r);
      if(s.knots>42) art += medallion(252,818,42,s,r);
      art += structuralRules(s,r);
      art += manuscriptText(300,872,s,r,5);
    } else if(mode === 'initial'){
      art += pigmentField(455,520,560,690,s,r,'blob');
      if(fol){
        art += vine(170,932,760,-1.25,s,r,{weight:1.15});
        art += vine(720,820,620,-1.82,s,r,{weight:1.02, side:-1});
        if(fol>.35) art += vineArc(216,935,685,840,s,r,.84);
      }
      if(s.showInitial) art += initial(r.n(390,470),r.n(610,660),r.n(420,520),s,r,s.initial);
      if(s.knots>20) art += knots(r.n(580,686),r.n(792,884),r.n(.43,.62),r.n(-14,14),s,r);
      if(s.knots>64) art += knots(300,168,.3,0,s,r);
      art += fragmentGlyphs(450,500,520,680,s,r);
      art += manuscriptText(274,928,s,r,4);
    } else if(mode === 'interlace'){
      art += pigmentField(438,518,520,770,s,r,'panel');
      art += knots(440,510,r.n(.98,1.26),r.n(-4,4),s,r,true);
      if(s.knots>26) art += knots(440,192,.56,r.n(-8,8),s,r);
      if(s.knots>46) art += knots(440,848,.54,r.n(-8,8),s,r);
      if(fol){
        art += vine(124,970,805,-1.5,s,r,{weight:1.02});
        art += vine(760,985,810,-1.64,s,r,{weight:1.02, side:-1});
      }
      if(s.showInitial) art += initial(175,292,r.n(126,188),s,r,s.initial);
      art += fragmentGlyphs(442,515,500,760,s,r);
      art += manuscriptText(230,944,s,r,3);
    } else {
      art += pigmentField(365,278,540,380,s,r) + pigmentField(520,626,640,460,s,r) + pigmentField(304,820,420,290,s,r);
      art += fragmentGlyphs(430,520,680,840,s,r);
      if(fol){
        for(let i=0;i<3+Math.round(fol*3);i++) art += vine(r.n(80,760),r.n(930,1020),r.n(380,720),r.n(-2.2,-.9),s,r,{weight:r.n(.82,1.38), side:r.chance(.5)?1:-1});
      }
      if(s.showInitial) art += initial(r.n(390,510),r.n(456,580),r.n(330,430),s,r,s.initial);
      if(s.knots>8) art += knots(r.n(240,638),r.n(728,880),r.n(.4,.68),r.n(-18,22),s,r);
      if(s.knots>38) art += knots(r.n(518,652),r.n(252,330),r.n(.42,.62),r.n(-12,12),s,r);
      art += structuralRules(s,r);
      art += manuscriptText(306,956,s,r,7);
    }
    art += lineDecor(90,90,700,870,r,s,22+Math.round(s.wear*.6));
    return art;
  }
  function render(settings){
    let s = {...settings}, r = O.RNG(s.seed); s.pal = O.palette(s.palette,r);
    let out = O.filters(s,r);
    out += `<g id="ornament">${composition(s.mode,s,r)}</g>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 880 1040" width="880" height="1040" role="img" aria-label="Generative ornamental artwork" preserveAspectRatio="xMidYMid meet">${out}</svg>`;
  }
  O.render = render;
  O.intro = () => {
    let r = O.RNG(72281), s = {pal:O.palettes.insular, foliage:58, wear:18, bleed:true};
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 330 350">${O.filters(s,r)}${vine(148,312,262,-1.42,s,r,{weight:.76})}${spiral(196,88,23,s,r,red(s))}</svg>`;
  };
})(window.Ornament);
